import { AIError, errorMessage, isReasoningModel, newId, parseEvent, readSSE, requestWithRetry, resultText, type Classified, type ProviderSession, type SessionInit, type ToolOutcome, type TurnHooks, type TurnResult } from '../core'

/** OpenAI Responses API adapter (function calling on current GPT models requires the Responses API). */
const API = 'https://api.openai.com/v1'
const LABEL = 'OpenAI'

type InputItem = Record<string, unknown>
type OutputItem = { type: string; id?: string; call_id?: string; name?: string; arguments?: string; content?: { type: string; text?: string; refusal?: string }[]; [key: string]: unknown }
type ResponseBody = { output?: OutputItem[]; status?: string; incomplete_details?: { reason?: string }; error?: { message?: string } | null }


function classify(model: string) {
  return (status: number, data: unknown): Classified => {
    const code = (data as { error?: { code?: string } } | undefined)?.error?.code
    const message = errorMessage(data)
    if (status === 401) return { error: new AIError('OpenAI rejected the API key. Check your key in AI Settings.', { status }), retry: false }
    if (status === 403) return { error: new AIError(message || 'This OpenAI key has no access to that model or region.', { status }), retry: false }
    if (status === 404 || code === 'model_not_found') return { error: new AIError(`The model “${model}” isn’t available to this OpenAI key. Choose another model in AI Settings.`, { status, modelMissing: true }), retry: false }
    if (status === 429) {
      if (code === 'insufficient_quota') return { error: new AIError('Your OpenAI account has no remaining credit. Add billing in the OpenAI dashboard or switch provider in AI Settings.', { status }), retry: false }
      return { error: new AIError('OpenAI has reached this key’s request limit. Wait a moment and retry, or choose another model in AI Settings.', { status }), retry: true }
    }
    return { error: new AIError(message || `OpenAI request failed (${status}).`, { status }), retry: status >= 500 }
  }
}

/** Items returned by the model go back verbatim; ids of plain items are dropped because responses are not stored server-side. */
const replayItem = (item: OutputItem): InputItem => {
  if (item.type === 'reasoning') return item
  const { id: _id, status: _status, ...rest } = item
  void _id; void _status
  return rest
}

export function createSession(init: SessionInit): ProviderSession {
  const { settings, apiKey, system, stream, model } = init
  const reasoning = isReasoningModel(model)
  const input: InputItem[] = init.messages.map(message => message.role === 'model'
    ? { role: 'assistant', content: message.text }
    : { role: 'user', content: [...(message.text.trim() ? [{ type: 'input_text', text: message.text }] : []), ...(message.image ? [{ type: 'input_image', image_url: message.image, detail: 'auto' }] : [])] })
  const tools = init.tools.map(tool => ({ type: 'function', name: tool.name, description: tool.description, parameters: tool.parameters, strict: false }))
  /** Tool results stay as objects until each request, so older ones can be compacted in place. */
  const pending: { item: InputItem; result: unknown }[] = []

  const serialise = () => input.map(item => {
    const entry = pending.find(p => p.item === item)
    return entry ? { ...item, output: resultText(entry.result) } : item
  })

  return {
    async turn(hooks: TurnHooks): Promise<TurnResult> {
      const body = {
        model, instructions: system, input: serialise(), tools, tool_choice: 'auto', parallel_tool_calls: true, store: false, stream,
        max_output_tokens: settings.maxOutputTokens,
        ...(reasoning ? { reasoning: { effort: 'low' }, include: ['reasoning.encrypted_content'] } : { temperature: settings.temperature }),
      }
      const response = await requestWithRetry({
        url: `${API}/responses`,
        init: { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) },
        signal: hooks.signal, label: LABEL, onProgress: hooks.onProgress, classify: classify(model),
      })
      let result: ResponseBody | undefined
      if (stream && response.body) {
        let text = ''
        const items: OutputItem[] = []
        let failure: string | undefined
        await readSSE(response.body, hooks.signal, data => {
          const event = parseEvent<{ type?: string; delta?: string; item?: OutputItem; output_index?: number; response?: ResponseBody; message?: string }>(data)
          if (!event) return
          if (event.type === 'response.output_text.delta' && event.delta) { text += event.delta; hooks.onText?.(text) }
          else if (event.type === 'response.output_item.done' && event.item) items[event.output_index ?? items.length] = event.item
          else if ((event.type === 'response.completed' || event.type === 'response.incomplete') && event.response) result = event.response
          else if (event.type === 'response.failed') failure = event.response?.error?.message || 'OpenAI could not complete the reply.'
          else if (event.type === 'error') failure = event.message || 'OpenAI stream error.'
        }, LABEL)
        if (failure) throw new AIError(failure)
        result ??= { output: items.filter(Boolean), status: 'completed' }
        if (!result.output?.length) result.output = items.filter(Boolean)
      } else result = await response.json() as ResponseBody
      const output = result.output || []
      for (const item of output) input.push(replayItem(item))
      const calls = output.filter(item => item.type === 'function_call').map(item => ({ id: item.call_id || newId(), name: item.name || '', args: item.arguments ?? '{}' }))
      const text = output.filter(item => item.type === 'message').flatMap(item => item.content || []).map(part => part.text ?? part.refusal ?? '').join('').trim()
      const length = result.status === 'incomplete' && result.incomplete_details?.reason === 'max_output_tokens'
      return { text, calls, finish: calls.length ? 'tool_calls' : length ? 'length' : 'stop' }
    },
    addToolResults(outcomes: ToolOutcome[]) {
      const images: InputItem[] = []
      for (const outcome of outcomes) {
        const item: InputItem = { type: 'function_call_output', call_id: outcome.call.id, output: '' }
        pending.push({ item, result: outcome.result })
        input.push(item)
        if (outcome.image) images.push({ type: 'input_image', image_url: outcome.image.url, detail: 'high' })
      }
      // Screenshots and generated artwork are shown to the model as an image right after the tool results.
      if (images.length) input.push({ role: 'user', content: [{ type: 'input_text', text: 'Image returned by the previous tool call(s):' }, ...images] })
    },
    addUserText(text: string) {
      input.push({ role: 'user', content: [{ type: 'input_text', text }] })
    },
  }
}

export async function testKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API}/models/${encodeURIComponent(model)}`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15000) })
    if (response.ok) return { success: true }
    const data = await response.json().catch(() => undefined)
    if (response.status === 401) return { success: false, error: 'OpenAI rejected this API key.' }
    if (response.status === 404) return { success: false, error: `The key works, but the model “${model}” isn’t available to it.` }
    return { success: false, error: errorMessage(data) || `OpenAI returned ${response.status}.` }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}

export async function listModels(apiKey: string, signal?: AbortSignal) {
  const response = await fetch(`${API}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
  const data = await response.json() as { data?: { id: string }[] }
  if (!response.ok) throw new AIError(errorMessage(data) || 'Could not list OpenAI models.')
  return (data.data || []).map(model => model.id).filter(id => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct/.test(id)).sort().reverse().map(id => ({ id, name: id }))
}
