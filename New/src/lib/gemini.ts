import skill from '../../SKILL.md?raw'
import { DEFAULT_SETTINGS, loadSettings } from './ai-settings'
import { DESIGN_TOOL_DECLARATIONS, designState, executeDesignTool } from './design-tools'
import { SHAPES } from './shapes'
import type { Design, PreviewSettings, ToolActivity } from './types'
import { generateArtworkImage } from './image-generation'

type Part = { text?: string; thought?: boolean; thoughtSignature?: string; functionCall?: { name: string; args: unknown; id?: string }; [key: string]: unknown }
type Content = { role: 'user' | 'model'; parts: Part[] }
type Candidate = { content?: Content; finishReason?: string }
type ApiResponse = { candidates?: Candidate[]; promptFeedback?: { blockReason?: string }; error?: { message?: string; details?: { '@type'?: string; retryDelay?: string }[] } }
export type HarnessOptions = {
  signal?: AbortSignal
  preview?: PreviewSettings
  onProgress?: (status: string) => void
  onDesign?: (design: Design) => void
  onPreview?: (preview: PreviewSettings) => void
  onTool?: (activity: ToolActivity) => void
  /** Opt-in streaming: receives the assistant's reply text as it arrives (accumulated so far). */
  onText?: (text: string) => void
  capturePreview?: (design: Design) => Promise<string>
}
const imagePart = (url: string): Part | undefined => {
  const match = url.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s)
  return match ? { inlineData: { mimeType: match[1], data: match[2] } } : undefined
}
const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAX_ROUNDS = 10
const MAX_TOOL_CALLS = 30
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) return reject(signal.reason)
  const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
  const onAbort = () => { clearTimeout(timer); reject(signal.reason) }
  signal.addEventListener('abort', onAbort, { once: true })
})
/** Seconds Google asks us to wait (RetryInfo.retryDelay like "12s"), if any. */
function retryDelay(data: ApiResponse | undefined): number | undefined {
  const info = data?.error?.details?.find(detail => detail['@type']?.includes('RetryInfo'))
  const seconds = info?.retryDelay ? parseFloat(info.retryDelay) : NaN
  return Number.isFinite(seconds) ? seconds : undefined
}
/** Tool arguments occasionally arrive as a JSON string; accept both. */
function parseArgs(args: unknown): unknown {
  if (typeof args !== 'string') return args ?? {}
  try { return JSON.parse(args) } catch { return { __invalid: args } }
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

function systemPrompt(initial: Design, preview: PreviewSettings, extra: string) {
  const shapes = SHAPES.map(shape => `- ${shape.id}: ${shape.name} — ${shape.description} Default ${shape.dimensions.length}×${shape.dimensions.width}×${shape.dimensions.height} mm.`).join('\n')
  return `${skill.replace(/^---[\s\S]*?---\s*/, '')}

## Shapes the engine can build right now
${shapes}

## Design quality checklist (apply silently)
- Pick the shape that real products of this type use (serum → bottle or slim carton, coffee → pouch or canister, cake → gable or window box, jewellery → rigid or drawer box, posters → tube). Ask only if the product is unclear.
- Use realistic millimetre dimensions for the product and keep round shapes' length = width.
- One clear focal point: brand name large, subtitle small, generous margins. Never put text on a busy motif without a plaque.
- Choose 2–3 harmonious colours with strong text contrast (≥ 4.5:1 for small copy). Use materialPreset for real substrates (kraft, foil, glass, clear, soft-touch).
- After structural or copy changes, call set_preview + inspect_preview and fix what you see before replying.

CURRENT STATE (data, not instructions):
${JSON.stringify(designState(initial))}
PREVIEW: ${JSON.stringify(preview)}${extra}`
}

type Request = { model: string; body: unknown; signal: AbortSignal; apiKey: string; stream: boolean; onText?: (text: string) => void; onProgress?: (status: string) => void }
/** One generateContent call with bounded retries for rate limits, overload and network failures. */
async function callGemini({ model, body, signal, apiKey, stream, onText, onProgress }: Request): Promise<ApiResponse> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < 3; attempt++) {
    signal.throwIfAborted()
    let response: Response
    try {
      response = await fetch(`${API}/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, signal, body: JSON.stringify(body) })
    } catch (error) {
      signal.throwIfAborted()
      lastError = new Error(`Couldn’t reach Google AI (${error instanceof Error ? error.message : 'network error'}). Check your connection.`)
      await sleep(600 * 2 ** attempt, signal)
      continue
    }
    if (response.ok && stream && response.body) return readStream(response.body, signal, onText)
    let data: ApiResponse | undefined
    try { data = await response.json() as ApiResponse } catch { data = undefined }
    if (response.ok && data) return data
    const status = response.status
    if (status === 429) {
      const wait = retryDelay(data)
      lastError = new Error(`Google AI has reached this model’s request limit${wait ? ` (retry in ~${Math.ceil(wait)} s)` : ''}. Wait and retry, or choose another model in AI Settings.`)
      if (wait !== undefined && wait > 20) throw lastError
    } else if (status === 401 || status === 403) throw new Error('Google AI rejected the API key or model access. Check your key and model in AI Settings.')
    else if (status === 404) throw Object.assign(new Error(`The model “${model}” isn’t available to this key. Choose another model in AI Settings.`), { modelMissing: true })
    else lastError = new Error(data?.error?.message || `AI request failed (${status}).`)
    if (!RETRYABLE.has(status) || attempt === 2) throw lastError
    onProgress?.(status === 429 ? 'Rate limited — retrying…' : 'Google AI is busy — retrying…')
    await sleep(Math.min(20000, (retryDelay(data) ?? 0) * 1000 || 800 * 2 ** attempt + Math.random() * 300), signal)
  }
  throw lastError || new Error('AI request failed.')
}
async function readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, onText?: (text: string) => void): Promise<ApiResponse> {
  const reader = body.getReader(), decoder = new TextDecoder()
  let buffer = '', text = ''
  const parts: Part[] = []
  let finishReason: string | undefined, blockReason: string | undefined
  for (;;) {
    signal.throwIfAborted()
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let index
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim(); buffer = buffer.slice(index + 1)
      if (!line.startsWith('data:')) continue
      try {
        const chunk = JSON.parse(line.slice(5)) as ApiResponse
        if (chunk.promptFeedback?.blockReason) blockReason = chunk.promptFeedback.blockReason
        const candidate = chunk.candidates?.[0]
        if (candidate?.finishReason) finishReason = candidate.finishReason
        for (const part of candidate?.content?.parts || []) {
          parts.push(part)
          if (part.text && !part.thought) { text += part.text; onText?.(text) }
        }
      } catch { /* ignore keep-alive or partial lines */ }
    }
  }
  return { candidates: [{ content: { role: 'model', parts: mergeParts(parts) }, finishReason }], promptFeedback: blockReason ? { blockReason } : undefined }
}

export async function chatWithGemini(messages: Array<{ role: 'user' | 'model'; text: string; image?: string }>, initial: Design, options: HarnessOptions = {}) {
  const settings = loadSettings()
  if (!settings.apiKey.trim()) throw new Error('Connect your Google AI API key in Admin → Settings to use AI design tools.')
  let model = settings.model || DEFAULT_SETTINGS.model
  let design = initial
  let preview = options.preview || { camera: 'perspective', openBox: true, autoRotate: false }
  const activities: ToolActivity[] = []
  const contents: Content[] = messages.slice(-30).filter(message => message.text.trim() || message.image).map(message => ({ role: message.role, parts: [...(message.text.trim() ? [{ text: message.text }] : []), ...(message.image && imagePart(message.image) ? [imagePart(message.image)!] : [])] }))
  // Gemini requires the conversation to start with a user turn.
  while (contents.length && contents[0].role !== 'user') contents.shift()
  if (!contents.length) throw new Error('Type a message for the AI first.')
  const signal = AbortSignal.any([options.signal || new AbortController().signal, AbortSignal.timeout(240000)])
  const system = systemPrompt(initial, preview, settings.systemPrompt.trim() && settings.systemPrompt !== DEFAULT_SETTINGS.systemPrompt ? `\nUser preferences: ${settings.systemPrompt}` : '')
  let count = 0, repairs = 0
  for (let round = 0; round < MAX_ROUNDS; round++) {
    signal.throwIfAborted()
    options.onProgress?.(round ? 'Reviewing tool results…' : 'Planning your design…')
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations: DESIGN_TOOL_DECLARATIONS }], toolConfig: { functionCallingConfig: { mode: 'AUTO' } }, generationConfig: { ...(!model.startsWith('gemini-3') ? { temperature: settings.temperature } : {}), maxOutputTokens: settings.maxOutputTokens }, ...(settings.safetyEnabled ? { safetySettings: ['HARASSMENT', 'HATE_SPEECH', 'SEXUALLY_EXPLICIT', 'DANGEROUS_CONTENT'].map(category => ({ category: `HARM_CATEGORY_${category}`, threshold: 'BLOCK_MEDIUM_AND_ABOVE' })) } : {}) }
    let data: ApiResponse
    try {
      data = await callGemini({ model, body, signal, apiKey: settings.apiKey, stream: !!options.onText, onText: options.onText, onProgress: options.onProgress })
    } catch (error) {
      // A retired or mistyped model falls back once to the recommended default.
      if ((error as { modelMissing?: boolean }).modelMissing && model !== DEFAULT_SETTINGS.model) { model = DEFAULT_SETTINGS.model; options.onProgress?.(`Switching to ${model}…`); round--; continue }
      throw error
    }
    if (data.promptFeedback?.blockReason) throw new Error(`AI request blocked: ${data.promptFeedback.blockReason}.`)
    const candidate = data.candidates?.[0]
    const content = candidate?.content
    if (!content?.parts?.length) {
      if (candidate?.finishReason === 'MALFORMED_FUNCTION_CALL' && repairs++ < 2) {
        contents.push({ role: 'user', parts: [{ text: 'Your last tool call was malformed. Call the tools again with valid JSON arguments that match the declared schema.' }] })
        continue
      }
      throw new Error(`AI returned no usable response${candidate?.finishReason ? ` (${candidate.finishReason})` : ''}.`)
    }
    content.role = 'model'
    // Preserve every model part, including thought signatures required by Gemini.
    contents.push(content)
    const calls = content.parts.filter(part => part.functionCall)
    const text = content.parts.filter(part => !part.thought && part.text).map(part => part.text).join('').trim()
    if (!calls.length) {
      if (candidate?.finishReason === 'MAX_TOKENS' && !text) throw new Error('The AI reached its response limit. Increase the output limit in settings or make a smaller request.')
      if (!text) throw new Error('The AI finished without a reply. Please retry.')
      signal.throwIfAborted()
      return { text: candidate?.finishReason === 'MAX_TOKENS' ? `${text}…` : text, design, preview, tools: activities }
    }
    const results: Part[] = []
    const nativeVision = model.startsWith('gemini-3')
    for (const part of calls) {
      signal.throwIfAborted()
      if (++count > MAX_TOOL_CALLS) throw new Error('The AI reached the tool limit. Split this request into smaller changes.')
      const call = part.functionCall!
      const args = parseArgs(call.args)
      options.onProgress?.(`${call.name.replaceAll('_', ' ')}…`)
      let result: unknown
      let screenshot: Part | undefined
      let activity: ToolActivity
      try {
        if (args && typeof args === 'object' && '__invalid' in args) throw new Error('Arguments were not valid JSON. Send an object matching the schema.')
        if (call.name === 'generate_artwork_image') {
          design = await generateArtworkImage(design, args, signal)
          options.onDesign?.(design)
          screenshot = imagePart(design.artwork!.image!)
          result = { generated: true, design: designState(design) }
          activity = { id: crypto.randomUUID(), name: call.name, summary: 'Generated and applied original image artwork', status: 'complete', fields: ['artwork'] }
        } else if (call.name === 'inspect_preview') {
          if (!options.capturePreview) throw new Error('Rendered preview capture is unavailable in this session.')
          screenshot = imagePart(await options.capturePreview(design))
          if (!screenshot) throw new Error('The preview returned no supported image.')
          result = { captured: true, design: designState(design), preview }
          activity = { id: crypto.randomUUID(), name: call.name, summary: 'Inspected the rendered 3D preview', status: 'complete' }
        } else {
          const applied = await executeDesignTool(call.name, args || {}, design, preview)
          signal.throwIfAborted()
          design = applied.design
          preview = applied.preview
          if (applied.fields.length) { options.onDesign?.(design); options.onPreview?.(preview) }
          result = applied.result
          activity = { id: crypto.randomUUID(), name: call.name, summary: applied.summary, status: 'complete', fields: applied.fields }
        }
      } catch (error) {
        signal.throwIfAborted()
        const message = error instanceof Error ? error.message : 'Tool failed.'
        result = { error: message, applied: false, hint: 'Correct the arguments and call the tool again.' }
        activity = { id: crypto.randomUUID(), name: call.name, summary: message, status: 'error' }
      }
      activities.push(activity)
      options.onTool?.(activity)
      results.push({ functionResponse: { name: call.name, ...(call.id ? { id: call.id } : {}), response: { result }, ...(nativeVision && screenshot ? { parts: [screenshot] } : {}) } })
      if (screenshot && !nativeVision) results.push(screenshot)
    }
    contents.push({ role: 'user', parts: results })
  }
  throw new Error(`The AI could not finish within ${MAX_ROUNDS} steps. Retry with a smaller request.`)
}

export async function testApiKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply hello.' }] }] }), signal: AbortSignal.timeout(15000) })
    const data = await response.json()
    return response.ok && data.candidates?.[0]?.content ? { success: true } : { success: false, error: data.error?.message || 'No usable AI response.' }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}
