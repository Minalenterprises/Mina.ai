import { AIError, errorMessage, newId, parseEvent, readSSE, requestWithRetry, resultText, type Classified, type ProviderSession, type SessionInit, type ToolOutcome, type TurnHooks, type TurnResult } from '../core'

/** OpenRouter adapter (OpenAI-compatible Chat Completions with tool calling and streaming). */
const API = 'https://openrouter.ai/api/v1'
const LABEL = 'OpenRouter'

type ToolCallChunk = { index?: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }
type ReasoningDetail = { type?: string; index?: number; text?: string; summary?: string; data?: string; signature?: string; [key: string]: unknown }
type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: unknown; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]; tool_call_id?: string; reasoning_details?: ReasoningDetail[] }
type Choice = { message?: { content?: string | null; tool_calls?: ChatMessage['tool_calls']; reasoning_details?: ReasoningDetail[] }; delta?: { content?: string | null; tool_calls?: ToolCallChunk[]; reasoning_details?: ReasoningDetail[] }; finish_reason?: string | null }
type Completion = { choices?: Choice[]; error?: { message?: string } }

const headers = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
  // Optional attribution headers recommended by OpenRouter.
  ...(typeof location !== 'undefined' && /^https?:/.test(location.origin) ? { 'HTTP-Referer': location.origin } : {}),
  'X-Title': 'Minal Packaging Studio',
})

function classify(model: string) {
  return (status: number, data: unknown): Classified => {
    const message = errorMessage(data)
    if (status === 401) return { error: new AIError('OpenRouter rejected the API key. Check your key in AI Settings.', { status }), retry: false }
    if (status === 402) return { error: new AIError('Your OpenRouter account has no remaining credit. Add credit at openrouter.ai or choose a free model.', { status }), retry: false }
    if (status === 404) return { error: new AIError(message && !/no endpoints/i.test(message) ? message : `The model “${model}” isn’t available on OpenRouter with tool calling. Choose another model in AI Settings.`, { status, modelMissing: true }), retry: false }
    if (status === 429) return { error: new AIError('OpenRouter has reached the request limit for this model. Wait a moment and retry, or choose another model in AI Settings.', { status }), retry: true }
    return { error: new AIError(message || `OpenRouter request failed (${status}).`, { status }), retry: status >= 500 || status === 408 }
  }
}

/** Streamed reasoning details arrive in pieces; pieces with the same index and type are joined. */
function mergeReasoning(details: ReasoningDetail[]): ReasoningDetail[] {
  const merged: ReasoningDetail[] = []
  for (const detail of details) {
    const last = merged[merged.length - 1]
    if (last && detail.index !== undefined && last.index === detail.index && last.type === detail.type) {
      for (const key of ['text', 'summary', 'data'] as const) if (typeof detail[key] === 'string') last[key] = `${last[key] || ''}${detail[key]}`
      if (detail.signature) last.signature = detail.signature
    } else merged.push({ ...detail })
  }
  return merged
}

async function readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, onText?: (text: string) => void) {
  let text = '', finish: string | null | undefined, failure: string | undefined
  const calls: { id: string; name: string; arguments: string }[] = []
  const reasoning: ReasoningDetail[] = []
  await readSSE(body, signal, data => {
    const chunk = parseEvent<Completion>(data)
    if (!chunk) return
    if (chunk.error?.message) failure = chunk.error.message
    const choice = chunk.choices?.[0]
    if (!choice) return
    const delta = choice.delta || {}
    if (delta.content) { text += delta.content; onText?.(text) }
    if (delta.reasoning_details?.length) reasoning.push(...delta.reasoning_details)
    for (const piece of delta.tool_calls || []) {
      const index = piece.index ?? calls.length
      calls[index] ??= { id: '', name: '', arguments: '' }
      if (piece.id) calls[index].id = piece.id
      if (piece.function?.name) calls[index].name += piece.function.name
      if (piece.function?.arguments) calls[index].arguments += piece.function.arguments
    }
    if (choice.finish_reason) finish = choice.finish_reason
  }, LABEL)
  if (failure && !text && !calls.length) throw new AIError(failure)
  return { text, calls: calls.filter(Boolean), finish, reasoning: mergeReasoning(reasoning) }
}

export function createSession(init: SessionInit): ProviderSession {
  const { settings, apiKey, system, stream, model } = init
  const messages: ChatMessage[] = [{ role: 'system', content: system }, ...init.messages.map((message): ChatMessage => message.role === 'model'
    ? { role: 'assistant', content: message.text }
    : { role: 'user', content: message.image ? [...(message.text.trim() ? [{ type: 'text', text: message.text }] : []), { type: 'image_url', image_url: { url: message.image } }] : message.text })]
  const tools = init.tools.map(tool => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.parameters } }))
  /** Tool results stay as objects until each request, so older ones can be compacted in place. */
  const pending = new Map<ChatMessage, unknown>()
  const serialise = () => messages.map(message => pending.has(message) ? { ...message, content: resultText(pending.get(message)) } : message)

  return {
    async turn(hooks: TurnHooks): Promise<TurnResult> {
      const body = { model, messages: serialise(), tools, tool_choice: 'auto', parallel_tool_calls: true, stream, max_tokens: settings.maxOutputTokens, temperature: settings.temperature }
      const response = await requestWithRetry({
        url: `${API}/chat/completions`, init: { method: 'POST', headers: headers(apiKey), body: JSON.stringify(body) },
        signal: hooks.signal, label: LABEL, onProgress: hooks.onProgress, classify: classify(model),
      })
      let text: string, finish: string | null | undefined, reasoning: ReasoningDetail[] | undefined
      let calls: { id: string; name: string; arguments: string }[]
      if (stream && response.body) ({ text, calls, finish, reasoning } = await readStream(response.body, hooks.signal, hooks.onText))
      else {
        const data = await response.json() as Completion
        if (data.error?.message && !data.choices?.length) throw new AIError(data.error.message)
        const choice = data.choices?.[0]
        text = choice?.message?.content || ''
        calls = (choice?.message?.tool_calls || []).map(call => ({ id: call.id, name: call.function.name, arguments: call.function.arguments }))
        finish = choice?.finish_reason
        reasoning = choice?.message?.reasoning_details
      }
      const normalised = calls.filter(call => call.name).map(call => ({ ...call, id: call.id || newId() }))
      messages.push({
        role: 'assistant', content: text || null,
        ...(normalised.length ? { tool_calls: normalised.map(call => ({ id: call.id, type: 'function' as const, function: { name: call.name, arguments: call.arguments || '{}' } })) } : {}),
        // Reasoning details (e.g. Gemini thought signatures) must be returned with tool calls.
        ...(reasoning?.length ? { reasoning_details: reasoning } : {}),
      })
      return { text: text.trim(), calls: normalised.map(call => ({ id: call.id, name: call.name, args: call.arguments || '{}' })), finish: normalised.length ? 'tool_calls' : finish === 'length' ? 'length' : 'stop' }
    },
    addToolResults(outcomes: ToolOutcome[]) {
      const images: unknown[] = []
      for (const outcome of outcomes) {
        const message: ChatMessage = { role: 'tool', tool_call_id: outcome.call.id, content: '' }
        pending.set(message, outcome.result)
        messages.push(message)
        if (outcome.image) images.push({ type: 'image_url', image_url: { url: outcome.image.url } })
      }
      if (images.length) messages.push({ role: 'user', content: [{ type: 'text', text: 'Image returned by the previous tool call(s):' }, ...images] })
    },
    addUserText(text: string) {
      messages.push({ role: 'user', content: text })
    },
  }
}

export async function testKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  try {
    const key = await fetch(`${API}/key`, { headers: headers(apiKey), signal: AbortSignal.timeout(15000) })
    if (key.status === 401) return { success: false, error: 'OpenRouter rejected this API key.' }
    if (!key.ok) return { success: false, error: errorMessage(await key.json().catch(() => undefined)) || `OpenRouter returned ${key.status}.` }
    const endpoints = await fetch(`${API}/models/${model.split('/').map(encodeURIComponent).join('/')}/endpoints`, { headers: headers(apiKey), signal: AbortSignal.timeout(15000) })
    if (!endpoints.ok) return { success: false, error: `The key works, but OpenRouter has no model “${model}”.` }
    const data = await endpoints.json() as { data?: { endpoints?: { supported_parameters?: string[] }[] } }
    const list = data.data?.endpoints || []
    if (!list.length) return { success: false, error: `The key works, but “${model}” has no available providers right now.` }
    if (!list.some(endpoint => endpoint.supported_parameters?.includes('tools'))) return { success: false, error: `The key works, but “${model}” doesn’t support tool calling, which the design tools need.` }
    return { success: true }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}

export async function listModels(_apiKey: string, signal?: AbortSignal) {
  const response = await fetch(`${API}/models?supported_parameters=tools`, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
  const data = await response.json() as { data?: { id: string; name?: string }[] }
  if (!response.ok) throw new AIError(errorMessage(data) || 'Could not list OpenRouter models.')
  return (data.data || []).filter(model => !model.id.endsWith(':batch')).map(model => ({ id: model.id, name: model.name || model.id }))
}
