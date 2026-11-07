import { DEFAULT_SETTINGS } from '../../ai-settings'
import { AIError, classifyCustom, corsHint, isJsonResponse, newId, parseEvent, readSSE, requestWithRetry, TOOLS_UNSUPPORTED, toolsUnsupportedError, type Classified, type Endpoint, type ProviderSession, type SessionInit, type ToolOutcome, type TurnHooks, type TurnResult } from '../core'

type Part = { text?: string; thought?: boolean; thoughtSignature?: string; functionCall?: { name: string; args: unknown; id?: string }; [key: string]: unknown }
type Content = { role: 'user' | 'model'; parts: Part[] }
type Candidate = { content?: Content; finishReason?: string }
type ApiResponse = { candidates?: Candidate[]; promptFeedback?: { blockReason?: string }; error?: { message?: string; details?: { '@type'?: string; retryDelay?: string }[] } }

const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const LABEL = 'Google AI'

/** Seconds Google asks us to wait (RetryInfo.retryDelay like "12s"), if any. */
function retryDelay(data: ApiResponse | undefined): number | undefined {
  const info = data?.error?.details?.find(detail => detail['@type']?.includes('RetryInfo'))
  const seconds = info?.retryDelay ? parseFloat(info.retryDelay) : NaN
  return Number.isFinite(seconds) ? seconds : undefined
}

function classify(model: string) {
  return (status: number, raw: unknown): Classified => {
    const data = raw as ApiResponse | undefined
    if (status === 429) {
      const wait = retryDelay(data)
      const error = new AIError(`Google AI has reached this model’s request limit${wait ? ` (retry in ~${Math.ceil(wait)} s)` : ''}. Wait and retry, or choose another model in AI Settings.`, { status })
      return { error, retry: true, giveUp: wait !== undefined && wait > 20, waitMs: wait !== undefined ? wait * 1000 : undefined }
    }
    if (status === 401 || status === 403) return { error: new AIError('Google AI rejected the API key or model access. Check your key and model in AI Settings.', { status }), retry: false }
    if (status === 404) return { error: new AIError(`The model “${model}” isn’t available to this key. Choose another model in AI Settings.`, { status, modelMissing: true }), retry: false }
    return { error: new AIError(data?.error?.message || `AI request failed (${status}).`, { status }), retry: true }
  }
}

/** Merge streamed chunks into whole parts, keeping function calls and thought signatures intact. */
function mergeParts(chunks: Part[]): Part[] {
  const merged: Part[] = []
  for (const part of chunks) {
    const last = merged[merged.length - 1]
    const plainText = typeof part.text === 'string' && !part.functionCall
    if (plainText && last && typeof last.text === 'string' && !last.functionCall && !!last.thought === !!part.thought && !last.thoughtSignature) {
      last.text += part.text
      if (part.thoughtSignature) last.thoughtSignature = part.thoughtSignature
    } else if (!plainText && part.thoughtSignature && !part.functionCall && last && !part.text) {
      last.thoughtSignature = part.thoughtSignature
    } else merged.push({ ...part })
  }
  return merged
}

async function readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, onText?: (text: string) => void, label = LABEL): Promise<ApiResponse> {
  let text = ''
  const parts: Part[] = []
  let finishReason: string | undefined, blockReason: string | undefined, streamError: string | undefined
  await readSSE(body, signal, data => {
    const chunk = parseEvent<ApiResponse>(data)
    if (!chunk) return
    if (chunk.error?.message) streamError = chunk.error.message
    if (chunk.promptFeedback?.blockReason) blockReason = chunk.promptFeedback.blockReason
    const candidate = chunk.candidates?.[0]
    if (candidate?.finishReason) finishReason = candidate.finishReason
    for (const part of candidate?.content?.parts || []) {
      parts.push(part)
      if (part.text && !part.thought) { text += part.text; onText?.(text) }
    }
  }, label)
  if (streamError && !parts.length) throw new AIError(streamError)
  return { candidates: [{ content: { role: 'model', parts: mergeParts(parts) }, finishReason }], promptFeedback: blockReason ? { blockReason } : undefined }
}

/** Google itself, or a custom Gemini-format endpoint (`base` is the API root such as …/v1beta). */
type Target = { models: string; label: string; headers: () => Record<string, string>; classify: (model: string) => (status: number, raw: unknown, headers: Headers | undefined) => Classified; networkHint?: string; custom: boolean }
function target(apiKey: string, endpoint?: Endpoint): Target {
  if (!endpoint) return { models: API, label: LABEL, headers: () => ({ 'x-goog-api-key': apiKey }), classify, custom: false }
  return { models: `${endpoint.base}/models`, label: endpoint.label, headers: endpoint.headers, classify: classifyCustom(endpoint.label), networkHint: corsHint(endpoint.base), custom: true }
}
const modelPath = (model: string) => model.replace(/^models\//, '').split('/').map(encodeURIComponent).join('/')

const imagePart = (image: { mimeType: string; data: string }): Part => ({ inlineData: { mimeType: image.mimeType, data: image.data } })

export function createSession(init: SessionInit): ProviderSession {
  const { settings, apiKey, system } = init
  let stream = init.stream
  const to = target(apiKey, init.endpoint)
  let model = init.model || DEFAULT_SETTINGS.model
  const contents: Content[] = init.messages.map(message => {
    const image = message.image?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s)
    return { role: message.role, parts: [...(message.text.trim() ? [{ text: message.text }] : []), ...(image ? [{ inlineData: { mimeType: image[1], data: image[2] } }] : [])] }
  })
  const functionDeclarations = init.tools.map(tool => ({ name: tool.name, description: tool.description, ...(tool.geminiParameters ? { parameters: tool.geminiParameters } : {}) }))
  const safetySettings = settings.safetyEnabled ? ['HARASSMENT', 'HATE_SPEECH', 'SEXUALLY_EXPLICIT', 'DANGEROUS_CONTENT'].map(category => ({ category: `HARM_CATEGORY_${category}`, threshold: 'BLOCK_MEDIUM_AND_ABOVE' })) : undefined

  async function call(hooks: TurnHooks): Promise<ApiResponse> {
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations }], toolConfig: { functionCallingConfig: { mode: 'AUTO' } }, generationConfig: { ...(!model.startsWith('gemini-3') ? { temperature: settings.temperature } : {}), maxOutputTokens: settings.maxOutputTokens }, ...(safetySettings ? { safetySettings } : {}) }
    const send = () => requestWithRetry({
      url: `${to.models}/${modelPath(model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json', ...to.headers() }, body: JSON.stringify(body) },
      signal: hooks.signal, label: to.label, onProgress: hooks.onProgress, networkHint: to.networkHint, classify: to.classify(model),
    })
    let response: Response
    try { response = await send() } catch (error) {
      if (!(to.custom && stream && error instanceof AIError && (error.unsupported === 'stream' || error.status === 404))) throw error
      // Custom servers without the streaming endpoint are asked again without it.
      stream = false
      response = await send()
    }
    if (stream && response.body && !isJsonResponse(response)) {
      try { return await readStream(response.body, hooks.signal, hooks.onText, to.label) } catch (error) {
        if (to.custom && error instanceof AIError && TOOLS_UNSUPPORTED.test(error.message)) throw toolsUnsupportedError(to.label, model)
        throw error
      }
    }
    const data = await response.json() as ApiResponse
    const reply = (data.candidates?.[0]?.content?.parts || []).filter(part => part.text && !part.thought).map(part => part.text).join('')
    if (init.stream && reply.trim()) hooks.onText?.(reply)
    return data
  }

  return {
    async turn(hooks: TurnHooks): Promise<TurnResult> {
      let data: ApiResponse
      try {
        data = await call(hooks)
      } catch (error) {
        // A retired or mistyped model falls back once to the recommended default.
        if (!to.custom && (error as AIError).modelMissing && model !== DEFAULT_SETTINGS.model) {
          model = DEFAULT_SETTINGS.model
          hooks.onProgress?.(`Switching to ${model}…`)
          data = await call(hooks)
        } else throw error
      }
      if (data.promptFeedback?.blockReason) throw new AIError(`AI request blocked: ${data.promptFeedback.blockReason}.`)
      const candidate = data.candidates?.[0]
      const content = candidate?.content
      if (!content?.parts?.length) {
        if (candidate?.finishReason === 'MALFORMED_FUNCTION_CALL') return { text: '', calls: [], finish: 'malformed' }
        throw new AIError(`AI returned no usable response${candidate?.finishReason ? ` (${candidate.finishReason})` : ''}.`)
      }
      content.role = 'model'
      // Preserve every model part, including thought signatures required by Gemini.
      contents.push(content)
      const calls = content.parts.filter(part => part.functionCall).map(part => ({ id: part.functionCall!.id || newId(), nativeId: part.functionCall!.id, name: part.functionCall!.name, args: part.functionCall!.args }))
      const text = content.parts.filter(part => !part.thought && part.text).map(part => part.text).join('').trim()
      return { text, calls, finish: calls.length ? 'tool_calls' : candidate?.finishReason === 'MAX_TOKENS' ? 'length' : 'stop' }
    },
    addToolResults(outcomes: ToolOutcome[]) {
      const nativeVision = model.startsWith('gemini-3')
      const parts: Part[] = []
      for (const outcome of outcomes) {
        const nativeId = outcome.call.nativeId
        parts.push({ functionResponse: { name: outcome.call.name, ...(nativeId ? { id: nativeId } : {}), response: { result: outcome.result }, ...(nativeVision && outcome.image ? { parts: [imagePart(outcome.image)] } : {}) } })
        if (outcome.image && !nativeVision) parts.push(imagePart(outcome.image))
      }
      contents.push({ role: 'user', parts })
    },
    addUserText(text: string) {
      contents.push({ role: 'user', parts: [{ text }] })
    },
  }
}

export async function testKey(apiKey: string, model: string, endpoint?: Endpoint): Promise<{ success: boolean; error?: string }> {
  const to = target(apiKey, endpoint)
  try {
    const tools = to.custom ? { tools: [{ functionDeclarations: [{ name: 'ping', description: 'Connectivity check. Do not call.' }] }] } : {}
    const init = { method: 'POST', headers: { 'Content-Type': 'application/json', ...to.headers() }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply hello.' }] }], ...tools }) }
    const url = `${to.models}/${modelPath(model)}:generateContent`
    const response = to.custom
      ? await requestWithRetry({ url, init, signal: AbortSignal.timeout(30000), label: to.label, attempts: 1, timeoutMs: 30000, networkHint: to.networkHint, classify: to.classify(model) })
      : await fetch(url, { ...init, signal: AbortSignal.timeout(15000) })
    const data = await response.json()
    return response.ok && data.candidates?.[0]?.content ? { success: true } : { success: false, error: data.error?.message || 'No usable AI response.' }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}

export async function listModels(apiKey: string, signal?: AbortSignal, endpoint?: Endpoint) {
  const to = target(apiKey, endpoint)
  const models: { id: string; name: string }[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 5; page++) {
    let response: Response
    try {
      response = await fetch(`${to.models}?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, { headers: to.headers(), signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
    } catch (error) { throw new AIError(`Couldn’t reach ${to.label} (${error instanceof Error ? error.message : 'network error'}). ${to.networkHint || 'Check your connection.'}`) }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new AIError(data.error?.message || `Could not list ${to.label} models (${response.status}).`)
    for (const m of data.models || []) {
      const usable = m.supportedGenerationMethods ? m.supportedGenerationMethods.includes('generateContent') : true
      if (usable && (to.custom || (/^models\/gemini/.test(m.name) && !/image|tts|embedding|live|audio/i.test(m.name)))) models.push({ id: String(m.name).replace(/^models\//, ''), name: m.displayName || m.name })
    }
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
  return models
}
