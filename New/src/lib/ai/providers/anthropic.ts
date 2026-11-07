import { AIError, errorMessage, newId, parseEvent, readSSE, requestWithRetry, resultText, type Classified, type ProviderSession, type SessionInit, type ToolOutcome, type TurnHooks, type TurnResult } from '../core'

/** Anthropic Messages API adapter, called directly from the browser. */
const API = 'https://api.anthropic.com/v1'
const LABEL = 'Claude'
const headers = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  // Required for direct browser calls; the key is the user's own and stays in their browser.
  'anthropic-dangerous-direct-browser-access': 'true',
})

type Block = { type: string; text?: string; id?: string; name?: string; input?: unknown; thinking?: string; signature?: string; data?: string; [key: string]: unknown }
type Message = { role: 'user' | 'assistant'; content: Block[] }
type ApiMessage = { content?: Block[]; stop_reason?: string; error?: { message?: string } }

function classify(model: string) {
  return (status: number, data: unknown): Classified => {
    const message = errorMessage(data)
    if (status === 401) return { error: new AIError('Anthropic rejected the API key. Check your key in AI Settings.', { status }), retry: false }
    if (status === 403) return { error: new AIError(message || 'This Anthropic key has no permission for that request.', { status }), retry: false }
    if (status === 404) return { error: new AIError(`The model “${model}” isn’t available to this Anthropic key. Choose another model in AI Settings.`, { status, modelMissing: true }), retry: false }
    if (status === 429) return { error: new AIError('Claude has reached this key’s rate limit. Wait a moment and retry, or choose another model in AI Settings.', { status }), retry: true }
    if (status === 529) return { error: new AIError('Claude is overloaded right now. Please retry shortly.', { status }), retry: true }
    if (status === 400 && /credit balance/i.test(message || '')) return { error: new AIError('Your Anthropic account has no remaining credit. Add billing in the Anthropic Console or switch provider in AI Settings.', { status }), retry: false }
    return { error: new AIError(message || `Claude request failed (${status}).`, { status }), retry: status >= 500 }
  }
}

const imageBlock = (url: string): Block | undefined => {
  const match = url.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/s)
  return match ? { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } } : undefined
}

/** Claude needs alternating roles starting with a user turn; neighbouring turns of the same role are merged. */
function toMessages(init: SessionInit): Message[] {
  const messages: Message[] = []
  for (const message of init.messages) {
    const role = message.role === 'model' ? 'assistant' : 'user'
    const content: Block[] = []
    if (message.text.trim()) content.push({ type: 'text', text: message.text })
    const image = message.role === 'user' && message.image ? imageBlock(message.image) : undefined
    if (image) content.push(image)
    if (!content.length) continue
    const last = messages[messages.length - 1]
    if (last?.role === role) last.content.push(...content)
    else messages.push({ role, content })
  }
  while (messages.length && messages[0].role !== 'user') messages.shift()
  return messages
}

/** Rebuilds the assistant message from stream events, preserving thinking blocks and their signatures for tool use. */
async function readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, onText?: (text: string) => void): Promise<ApiMessage> {
  const blocks: Block[] = []
  const json: string[] = []
  let stopReason: string | undefined, text = '', failure: string | undefined
  await readSSE(body, signal, (data, event) => {
    const payload = parseEvent<{ type?: string; index?: number; content_block?: Block; delta?: { type?: string; text?: string; partial_json?: string; thinking?: string; signature?: string; stop_reason?: string }; error?: { message?: string } }>(data)
    if (!payload) return
    const type = payload.type || event
    const index = payload.index ?? 0
    if (type === 'content_block_start' && payload.content_block) {
      blocks[index] = { ...payload.content_block }
      json[index] = ''
    } else if (type === 'content_block_delta' && payload.delta) {
      const block = blocks[index]
      const delta = payload.delta
      if (!block) return
      if (delta.type === 'text_delta' && delta.text) { block.text = (block.text || '') + delta.text; text += delta.text; onText?.(text) }
      else if (delta.type === 'input_json_delta') json[index] += delta.partial_json || ''
      else if (delta.type === 'thinking_delta') block.thinking = (block.thinking || '') + (delta.thinking || '')
      else if (delta.type === 'signature_delta') block.signature = (block.signature || '') + (delta.signature || '')
    } else if (type === 'content_block_stop') {
      const block = blocks[index]
      if (block?.type === 'tool_use' || block?.type === 'server_tool_use') {
        const raw = json[index]
        if (raw?.trim()) { try { block.input = JSON.parse(raw) } catch { block.input = { __invalid: raw } } }
        else block.input ??= {}
      }
    } else if (type === 'message_delta' && payload.delta?.stop_reason) stopReason = payload.delta.stop_reason
    else if (type === 'error') failure = payload.error?.message || 'Claude stream error.'
  }, LABEL)
  if (failure) throw new AIError(failure)
  return { content: blocks.filter(Boolean), stop_reason: stopReason }
}

export function createSession(init: SessionInit): ProviderSession {
  const { settings, apiKey, system, stream, model } = init
  const messages = toMessages(init)
  const tools = init.tools.map((tool, index, all) => ({ name: tool.name, description: tool.description, input_schema: tool.parameters, ...(index === all.length - 1 ? { cache_control: { type: 'ephemeral' } } : {}) }))
  /** Tool results stay as objects until each request, so older ones can be compacted in place. */
  const pending = new Map<Block, unknown>()

  const serialise = () => messages.map(message => ({
    role: message.role,
    content: message.content.map(block => pending.has(block) ? { ...block, content: [{ type: 'text', text: resultText(pending.get(block)) }, ...(block.content as Block[] || [])] } : block),
  }))

  return {
    async turn(hooks: TurnHooks): Promise<TurnResult> {
      // The system prompt and tools are identical every round, so they are cached to speed up follow-up rounds.
      const body = { model, system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: serialise(), tools, tool_choice: { type: 'auto' }, max_tokens: settings.maxOutputTokens, stream }
      const response = await requestWithRetry({
        url: `${API}/messages`, init: { method: 'POST', headers: headers(apiKey), body: JSON.stringify(body) },
        signal: hooks.signal, label: LABEL, onProgress: hooks.onProgress, classify: classify(model),
      })
      const data = stream && response.body ? await readStream(response.body, hooks.signal, hooks.onText) : await response.json() as ApiMessage
      // Empty text blocks are rejected when replayed, so they are dropped.
      const content = (data.content || []).filter(block => block.type !== 'text' || block.text?.trim())
      if (content.length) messages.push({ role: 'assistant', content })
      const calls = content.filter(block => block.type === 'tool_use').map(block => ({ id: block.id || newId(), name: block.name || '', args: block.input ?? {} }))
      const text = content.filter(block => block.type === 'text').map(block => block.text).join('').trim()
      if (data.stop_reason === 'refusal' && !text) throw new AIError('Claude declined this request. Try rephrasing it.')
      if (data.stop_reason === 'pause_turn' && !calls.length) return { text, calls, finish: 'continue' }
      return { text, calls, finish: calls.length ? 'tool_calls' : data.stop_reason === 'max_tokens' ? 'length' : 'stop' }
    },
    addToolResults(outcomes: ToolOutcome[]) {
      const content: Block[] = outcomes.map(outcome => {
        const image = outcome.image ? imageBlock(outcome.image.url) : undefined
        const block: Block = { type: 'tool_result', tool_use_id: outcome.call.id, content: image ? [image] : [], ...(outcome.error ? { is_error: true } : {}) }
        pending.set(block, outcome.result)
        return block
      })
      messages.push({ role: 'user', content })
    },
    addUserText(text: string) {
      const last = messages[messages.length - 1]
      if (last?.role === 'user') last.content.push({ type: 'text', text })
      else messages.push({ role: 'user', content: [{ type: 'text', text }] })
    },
  }
}

export async function testKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API}/models/${encodeURIComponent(model)}`, { headers: headers(apiKey), signal: AbortSignal.timeout(15000) })
    if (response.ok) return { success: true }
    const data = await response.json().catch(() => undefined)
    if (response.status === 401) return { success: false, error: 'Anthropic rejected this API key.' }
    if (response.status === 404) return { success: false, error: `The key works, but the model “${model}” isn’t available to it.` }
    return { success: false, error: errorMessage(data) || `Anthropic returned ${response.status}.` }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}

export async function listModels(apiKey: string, signal?: AbortSignal) {
  const response = await fetch(`${API}/models?limit=100`, { headers: headers(apiKey), signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
  const data = await response.json() as { data?: { id: string; display_name?: string }[] }
  if (!response.ok) throw new AIError(errorMessage(data) || 'Could not list Claude models.')
  return (data.data || []).map(model => ({ id: model.id, name: model.display_name || model.id }))
}
