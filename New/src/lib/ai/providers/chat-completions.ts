import { AIError, classifyCustom, corsHint, errorMessage, isJsonResponse, newId, parseEvent, readSSE, requestWithRetry, resultText, TOOLS_UNSUPPORTED, toolsUnsupportedError, type Classified, type Endpoint, type ProviderSession, type SessionInit, type ToolOutcome, type TurnHooks, type TurnResult } from '../core'

/**
 * OpenAI-compatible Chat Completions adapter with tool calling and streaming.
 * Used by OpenRouter (./openrouter.ts) and by every custom provider in the OpenAI-compatible format
 * (Groq, Together, Mistral, DeepSeek, xAI, Fireworks, Z.ai, Ollama, LM Studio, …).
 */

type ToolCallChunk = { index?: number; id?: string; type?: string; function?: { name?: string; arguments?: unknown } }
type ReasoningDetail = { type?: string; index?: number; text?: string; summary?: string; data?: string; signature?: string; [key: string]: unknown }
type WireToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: unknown; tool_calls?: WireToolCall[]; tool_call_id?: string; reasoning_details?: ReasoningDetail[]; reasoning_content?: string }
type Delta = { content?: string | null; tool_calls?: ToolCallChunk[]; reasoning_details?: ReasoningDetail[]; reasoning_content?: string | null }
type Choice = { message?: { content?: string | null; tool_calls?: { id?: string; function?: { name?: string; arguments?: unknown } }[]; reasoning_details?: ReasoningDetail[]; reasoning_content?: string | null }; delta?: Delta; finish_reason?: string | null }
type Completion = { choices?: Choice[]; error?: { message?: string } | string }

export type ChatConfig = {
  /** API root; requests go to `${base}/chat/completions`. */
  base: string
  label: string
  headers: () => Record<string, string>
  classify: (model: string) => (status: number, data: unknown, headers: Headers | undefined) => Classified
  /** Custom endpoints: send only widely supported fields and adapt to servers without streaming, images or reasoning replay. */
  custom?: boolean
  networkHint?: string
}

/** Some servers send tool arguments as an object instead of a JSON string. */
const argText = (value: unknown) => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)
const streamError = (chunk: Completion) => typeof chunk.error === 'string' ? chunk.error : chunk.error?.message

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

async function readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, label: string, onText?: (text: string) => void) {
  let text = '', finish: string | null | undefined, failure: string | undefined, reasoningContent = ''
  const calls: { id: string; name: string; arguments: string }[] = []
  const reasoning: ReasoningDetail[] = []
  await readSSE(body, signal, data => {
    const chunk = parseEvent<Completion>(data)
    if (!chunk) return
    const error = streamError(chunk)
    if (error) failure = error
    const choice = chunk.choices?.[0]
    if (!choice) return
    const delta = choice.delta || choice.message as Delta || {}
    if (delta.content) { text += delta.content; onText?.(text) }
    if (delta.reasoning_details?.length) reasoning.push(...delta.reasoning_details)
    if (typeof delta.reasoning_content === 'string') reasoningContent += delta.reasoning_content
    for (const piece of delta.tool_calls || []) {
      const index = piece.index ?? calls.length
      calls[index] ??= { id: '', name: '', arguments: '' }
      if (piece.id) calls[index].id = piece.id
      if (piece.function?.name) calls[index].name += piece.function.name
      if (piece.function?.arguments != null) calls[index].arguments += argText(piece.function.arguments)
    }
    if (choice.finish_reason) finish = choice.finish_reason
  }, label)
  if (failure && !text && !calls.length) throw new AIError(failure)
  return { text, calls: calls.filter(Boolean), finish, reasoning: mergeReasoning(reasoning), reasoningContent }
}

const isImagePart = (part: unknown) => !!part && typeof part === 'object' && (part as { type?: string }).type === 'image_url'
const IMAGE_NOTE = 'Image returned by the previous tool call(s):'

export function createChatSession(init: SessionInit, config: ChatConfig): ProviderSession {
  const { settings, system, model } = init
  const { custom, label } = config
  let stream = init.stream, images = true, replayReasoning = true
  const messages: ChatMessage[] = [{ role: 'system', content: system }, ...init.messages.map((message): ChatMessage => message.role === 'model'
    ? { role: 'assistant', content: message.text }
    : { role: 'user', content: message.image ? [...(message.text.trim() ? [{ type: 'text', text: message.text }] : []), { type: 'image_url', image_url: { url: message.image } }] : message.text })]
  const tools = init.tools.map(tool => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.parameters } }))
  /** Tool results stay as objects until each request, so older ones can be compacted in place. */
  const pending = new Map<ChatMessage, unknown>()

  /** Builds the wire messages; for servers without image input, images become a short text note. */
  const serialise = () => messages.flatMap((message): ChatMessage[] => {
    let next: ChatMessage = pending.has(message) ? { ...message, content: resultText(pending.get(message)) } : message
    if (!replayReasoning && next.reasoning_content !== undefined) { const { reasoning_content: _drop, ...rest } = next; void _drop; next = rest }
    if (!images && Array.isArray(next.content)) {
      const parts = (next.content as unknown[]).filter(part => !isImagePart(part)) as { type?: string; text?: string }[]
      if (parts.length === 1 && parts[0].text === IMAGE_NOTE) return []
      next = { ...next, content: parts.map(part => part.text || '').join('\n') || '(image omitted: this model does not accept images)' }
    }
    return [next]
  })

  async function request(hooks: TurnHooks) {
    const body = {
      model, messages: serialise(), tools, tool_choice: 'auto', stream, max_tokens: settings.maxOutputTokens, temperature: settings.temperature,
      // Custom servers get only the widely supported fields; strict ones reject anything unknown.
      ...(custom ? {} : { parallel_tool_calls: true }),
    }
    return requestWithRetry({
      url: `${config.base}/chat/completions`, init: { method: 'POST', headers: { 'Content-Type': 'application/json', ...config.headers() }, body: JSON.stringify(body) },
      signal: hooks.signal, label, onProgress: hooks.onProgress, networkHint: config.networkHint, classify: config.classify(model),
    })
  }

  /** Sends one turn; custom servers that reject streaming, images or reasoning replay are retried without them. */
  async function send(hooks: TurnHooks): Promise<Response> {
    for (let fixes = 0; ; fixes++) {
      try { return await request(hooks) } catch (error) {
        const unsupported = error instanceof AIError ? error.unsupported : undefined
        if (!custom || fixes >= 3 || !unsupported) throw error
        if (unsupported === 'stream' && stream) stream = false
        else if (unsupported === 'images' && images) { images = false; hooks.onProgress?.('Continuing without images…') }
        else if (unsupported === 'reasoning' && replayReasoning) replayReasoning = false
        else throw error
      }
    }
  }

  return {
    async turn(hooks: TurnHooks): Promise<TurnResult> {
      const response = await send(hooks)
      let text: string, finish: string | null | undefined, reasoning: ReasoningDetail[] | undefined, reasoningContent: string | undefined
      let calls: { id: string; name: string; arguments: string }[]
      // Servers without streaming answer a streaming request with plain JSON; both are handled.
      if (stream && response.body && !isJsonResponse(response)) {
        try { ({ text, calls, finish, reasoning, reasoningContent } = await readStream(response.body, hooks.signal, label, hooks.onText)) } catch (error) {
          if (custom && error instanceof AIError && TOOLS_UNSUPPORTED.test(error.message)) throw toolsUnsupportedError(label, model)
          throw error
        }
      } else {
        const data = await response.json() as Completion
        const error = streamError(data)
        if (error && !data.choices?.length) throw custom && TOOLS_UNSUPPORTED.test(error) ? toolsUnsupportedError(label, model) : new AIError(error)
        const choice = data.choices?.[0]
        text = choice?.message?.content || ''
        calls = (choice?.message?.tool_calls || []).map(call => ({ id: call.id || '', name: call.function?.name || '', arguments: argText(call.function?.arguments) }))
        finish = choice?.finish_reason
        reasoning = choice?.message?.reasoning_details
        reasoningContent = choice?.message?.reasoning_content || undefined
        // Streaming was asked for but the server answered in one piece: show the reply all at once.
        if (init.stream && text) hooks.onText?.(text)
      }
      const normalised = calls.filter(call => call.name).map(call => ({ ...call, id: call.id || newId() }))
      messages.push({
        role: 'assistant', content: text || null,
        ...(normalised.length ? { tool_calls: normalised.map(call => ({ id: call.id, type: 'function' as const, function: { name: call.name, arguments: call.arguments || '{}' } })) } : {}),
        // Reasoning details (e.g. Gemini thought signatures on OpenRouter) must be returned with tool calls.
        ...(reasoning?.length ? { reasoning_details: reasoning } : {}),
        // Thinking models such as DeepSeek need their reasoning replayed alongside tool calls.
        ...(custom && reasoningContent && normalised.length ? { reasoning_content: reasoningContent } : {}),
      })
      return { text: text.trim(), calls: normalised.map(call => ({ id: call.id, name: call.name, args: call.arguments || '{}' })), finish: normalised.length ? 'tool_calls' : finish === 'length' ? 'length' : 'stop' }
    },
    addToolResults(outcomes: ToolOutcome[]) {
      const pictures: unknown[] = []
      for (const outcome of outcomes) {
        const message: ChatMessage = { role: 'tool', tool_call_id: outcome.call.id, content: '' }
        pending.set(message, outcome.result)
        messages.push(message)
        if (outcome.image) pictures.push({ type: 'image_url', image_url: { url: outcome.image.url } })
      }
      if (pictures.length) messages.push({ role: 'user', content: [{ type: 'text', text: IMAGE_NOTE }, ...pictures] })
    },
    addUserText(text: string) {
      messages.push({ role: 'user', content: text })
    },
  }
}

const config = (endpoint: Endpoint): ChatConfig => ({ base: endpoint.base, label: endpoint.label, headers: endpoint.headers, classify: classifyCustom(endpoint.label), custom: true, networkHint: corsHint(endpoint.base) })
const requireEndpoint = (endpoint: Endpoint | undefined) => { if (!endpoint) throw new AIError('This provider needs a base URL. Add it in AI Settings.'); return endpoint }

export function createSession(init: SessionInit): ProviderSession {
  return createChatSession(init, config(requireEndpoint(init.endpoint)))
}

/** Sends one tiny request with a tool attached: confirms the URL, key, model and tool support in one go. */
export async function testKey(_apiKey: string, model: string, endpoint?: Endpoint): Promise<{ success: boolean; error?: string }> {
  try {
    const target = config(requireEndpoint(endpoint))
    const body = { model, messages: [{ role: 'user', content: 'Reply with OK.' }], tools: [{ type: 'function', function: { name: 'ping', description: 'Connectivity check. Do not call.', parameters: { type: 'object', properties: {} } } }], tool_choice: 'auto', max_tokens: 64, stream: false }
    const response = await requestWithRetry({
      url: `${target.base}/chat/completions`, init: { method: 'POST', headers: { 'Content-Type': 'application/json', ...target.headers() }, body: JSON.stringify(body) },
      signal: AbortSignal.timeout(30000), label: target.label, attempts: 1, timeoutMs: 30000, networkHint: target.networkHint, classify: target.classify(model),
    })
    const data = await response.json().catch(() => undefined) as Completion | undefined
    if (data?.choices?.length) return { success: true }
    return { success: false, error: (data && streamError(data)) || `${target.label} answered, but not in the Chat Completions format. Check the base URL and API format.` }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}

/** GET {base}/models (OpenAI format; Ollama’s native `models[]` shape is accepted too). */
export async function listModels(_apiKey: string, signal?: AbortSignal, endpoint?: Endpoint) {
  const target = config(requireEndpoint(endpoint))
  let response: Response
  try {
    response = await fetch(`${target.base}/models`, { headers: target.headers(), signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
  } catch (error) {
    throw new AIError(`Couldn’t reach ${target.label} (${error instanceof Error ? error.message : 'network error'}). ${target.networkHint}`)
  }
  const data = await response.json().catch(() => undefined) as { data?: { id?: string; name?: string }[]; models?: { id?: string; name?: string; model?: string }[] } | undefined
  if (!response.ok) throw new AIError(errorMessage(data) || `${target.label} returned ${response.status} for its model list. This server may not offer a models endpoint; type the model ID instead.`)
  const list = (data?.data || data?.models || []).map(item => ({ id: item.id || (item as { model?: string }).model || item.name || '', name: item.name || item.id || '' })).filter(item => item.id)
  return list.sort((a, b) => a.id.localeCompare(b.id))
}
