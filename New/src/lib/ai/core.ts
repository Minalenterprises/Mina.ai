import type { AISettings } from '../ai-settings'
import type { Design, PreviewSettings, ToolActivity } from '../types'

/** One conversation turn as stored in the studio. `model` is the assistant. */
export type ChatMessage = { role: 'user' | 'model'; text: string; image?: string }

export type HarnessOptions = {
  signal?: AbortSignal
  preview?: PreviewSettings
  /** Short, user-facing status line ("Thinking…", "Applying edits…"). Never contains tool names or JSON. */
  onProgress?: (status: string) => void
  onDesign?: (design: Design) => void
  onPreview?: (preview: PreviewSettings) => void
  /** Debug feed of every tool execution. Not meant for the end-user UI. */
  onTool?: (activity: ToolActivity) => void
  /** Opt-in streaming: receives the assistant's reply text for the current model turn as it arrives (accumulated so far). */
  onText?: (text: string) => void
  capturePreview?: (design: Design) => Promise<string>
  /** `magic` runs Magic Build: the model builds a complete package from one sentence. */
  mode?: 'chat' | 'magic'
}

export type AgentResult = { text: string; design: Design; preview: PreviewSettings; tools: ToolActivity[] }

/** A provider-neutral tool call. `id` is the provider's call id (generated when the provider has none). */
export type ToolCall = { id: string; name: string; args: unknown; nativeId?: string }

export type InlineImage = { mimeType: string; data: string; url: string }

/** Result of executing one tool call, ready to be returned to any provider. */
export type ToolOutcome = { call: ToolCall; result: unknown; image?: InlineImage; activity: ToolActivity; error?: boolean }

export type TurnFinish = 'stop' | 'tool_calls' | 'length' | 'malformed' | 'continue'
export type TurnResult = { text: string; calls: ToolCall[]; finish: TurnFinish }

export type JsonSchema = { type?: string; description?: string; enum?: unknown[]; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema; additionalProperties?: boolean }
export type ToolSpec = { name: string; description: string; parameters: JsonSchema; geminiParameters?: unknown }

export type SessionInit = {
  system: string
  messages: ChatMessage[]
  tools: ToolSpec[]
  settings: AISettings
  apiKey: string
  model: string
  stream: boolean
}
export type TurnHooks = { signal: AbortSignal; onText?: (text: string) => void; onProgress?: (status: string) => void }

/** One provider conversation. The agent loop drives it; the session owns the provider's native message format. */
export interface ProviderSession {
  /** Runs one model turn on the conversation so far and records the model's reply in the conversation. */
  turn(hooks: TurnHooks): Promise<TurnResult>
  /** Returns the results of the previous turn's tool calls to the model. */
  addToolResults(outcomes: ToolOutcome[]): void
  /** Adds a plain user instruction (used to repair malformed tool calls). */
  addUserText(text: string): void
}
export type ProviderModule = {
  createSession(init: SessionInit): ProviderSession
  testKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }>
  listModels?(apiKey: string, signal?: AbortSignal): Promise<{ id: string; name: string }[]>
}

/** Error with routing hints for the agent loop. */
export class AIError extends Error {
  modelMissing?: boolean
  status?: number
  constructor(message: string, extra: { modelMissing?: boolean; status?: number } = {}) {
    super(message)
    this.name = 'AIError'
    Object.assign(this, extra)
  }
}

export const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) return reject(signal.reason)
  const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
  const onAbort = () => { clearTimeout(timer); reject(signal.reason) }
  signal.addEventListener('abort', onAbort, { once: true })
})

/** Tool arguments occasionally arrive as a JSON string; accept both. */
export function parseArgs(args: unknown): unknown {
  if (typeof args !== 'string') return args ?? {}
  if (!args.trim()) return {}
  try { return JSON.parse(args) } catch { return { __invalid: args } }
}

export function inlineImage(url: string | undefined): InlineImage | undefined {
  const match = url?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s)
  return match ? { mimeType: match[1], data: match[2], url: url! } : undefined
}

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)

/** Serialises a tool result for providers that take text. Undefined fields are dropped. */
export const resultText = (result: unknown) => JSON.stringify(result ?? null) ?? 'null'

/** Converts the Gemini-style (uppercase) tool schema into standard JSON Schema for OpenAI, Anthropic and OpenRouter. */
export function toJsonSchema(schema: unknown): JsonSchema {
  if (!schema || typeof schema !== 'object') return { type: 'object', properties: {} }
  const input = schema as Record<string, unknown>
  const output: JsonSchema = {}
  if (typeof input.type === 'string') output.type = input.type.toLowerCase()
  if (typeof input.description === 'string') output.description = input.description
  if (Array.isArray(input.enum)) output.enum = [...input.enum]
  if (input.properties && typeof input.properties === 'object') output.properties = Object.fromEntries(Object.entries(input.properties as Record<string, unknown>).map(([key, value]) => [key, toJsonSchema(value)]))
  if (Array.isArray(input.required) && input.required.length) output.required = [...input.required as string[]]
  if (input.items) output.items = toJsonSchema(input.items)
  if (output.type === 'object' && !output.properties) output.properties = {}
  return output
}

const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529])
export type Classified = { error: Error; retry: boolean; waitMs?: number; giveUp?: boolean }

export type RequestOptions = {
  url: string
  init: RequestInit
  signal: AbortSignal
  label: string
  attempts?: number
  /** Per-attempt time limit until response headers arrive. */
  timeoutMs?: number
  onProgress?: (status: string) => void
  /** Maps a failed response to a clear, actionable error and whether it is worth retrying. */
  classify: (status: number, data: unknown, headers: Headers | undefined) => Classified
}

/** Seconds from a Retry-After header, if present. */
export function retryAfterMs(headers: Headers | undefined): number | undefined {
  const value = headers?.get?.('retry-after')
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds * 1000
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

/** fetch with bounded retries (exponential backoff with jitter) for rate limits, overload and network failures. */
export async function requestWithRetry({ url, init, signal, label, attempts = 3, timeoutMs = 90000, onProgress, classify }: RequestOptions): Promise<Response> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < attempts; attempt++) {
    signal.throwIfAborted()
    let response: Response
    // The time limit covers waiting for the response headers only, so long streamed replies are never cut off.
    const attempt$ = new AbortController()
    const forward = () => attempt$.abort(signal.reason)
    signal.addEventListener('abort', forward, { once: true })
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; attempt$.abort(new DOMException('Request timed out', 'TimeoutError')) }, timeoutMs)
    try {
      response = await fetch(url, { ...init, signal: attempt$.signal })
    } catch (error) {
      signal.throwIfAborted()
      timedOut ||= error instanceof DOMException && error.name === 'TimeoutError'
      lastError = new AIError(timedOut ? `${label} took too long to respond. Please retry.` : `Couldn’t reach ${label} (${error instanceof Error ? error.message : 'network error'}). Check your connection.`)
      if (attempt === attempts - 1) break
      onProgress?.('Reconnecting…')
      await sleep(600 * 2 ** attempt + Math.random() * 250, signal)
      continue
    } finally {
      clearTimeout(timer)
    }
    if (response.ok) {
      // Keep forwarding user aborts to the body stream; the listener goes away with the request.
      return response
    }
    signal.removeEventListener('abort', forward)
    let data: unknown
    try { data = await response.json() } catch { data = undefined }
    const status = response.status
    const verdict = classify(status, data, response.headers)
    lastError = verdict.error
    if (verdict.giveUp || !verdict.retry || !RETRYABLE.has(status) || attempt === attempts - 1) throw lastError
    onProgress?.(status === 429 ? 'Rate limited — retrying…' : `${label} is busy — retrying…`)
    await sleep(Math.min(20000, verdict.waitMs ?? retryAfterMs(response.headers) ?? 800 * 2 ** attempt + Math.random() * 300), signal)
  }
  throw lastError || new AIError(`${label} request failed.`)
}

/**
 * Reads a server-sent event stream and calls `onEvent` for each complete event.
 * Aborts with a clear error when the server goes silent for `idleMs`.
 */
export async function readSSE(body: ReadableStream<Uint8Array>, signal: AbortSignal, onEvent: (data: string, event?: string) => void, label: string, idleMs = 60000) {
  const reader = body.getReader(), decoder = new TextDecoder()
  let buffer = '', eventName: string | undefined, dataLines: string[] = []
  const flush = () => {
    if (dataLines.length) onEvent(dataLines.join('\n'), eventName)
    dataLines = []; eventName = undefined
  }
  const onAbort = () => { void reader.cancel().catch(() => undefined) }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    for (;;) {
      signal.throwIfAborted()
      let timer: ReturnType<typeof setTimeout> | undefined
      const idle = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new AIError(`${label} stopped responding mid-reply. Please retry.`)), idleMs) })
      let chunk: ReadableStreamReadResult<Uint8Array>
      try { chunk = await Promise.race([reader.read(), idle]) } finally { clearTimeout(timer) }
      signal.throwIfAborted()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      let index
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, ''); buffer = buffer.slice(index + 1)
        if (!line) { flush(); continue }
        if (line.startsWith(':')) continue
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
      }
    }
    buffer += decoder.decode()
    if (buffer.trim().startsWith('data:')) dataLines.push(buffer.trim().slice(5).replace(/^ /, ''))
    flush()
  } catch (error) {
    void reader.cancel().catch(() => undefined)
    throw error
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}

/** Parses JSON from an SSE data payload; returns undefined for keep-alives and partial lines. */
export function parseEvent<T>(data: string): T | undefined {
  if (!data || data === '[DONE]') return undefined
  try { return JSON.parse(data) as T } catch { return undefined }
}

/** Reads a provider's error message from common error body shapes. */
export function errorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const value = data as { error?: { message?: string } | string; message?: string }
  if (typeof value.error === 'string') return value.error
  return value.error?.message || value.message
}

/** OpenAI reasoning models reject sampling parameters and accept a reasoning effort. */
export const isReasoningModel = (model: string) => /^(o\d|gpt-5|gpt-6|gpt-oss)/.test(model)
