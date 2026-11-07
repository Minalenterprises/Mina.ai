import skill from '../../SKILL.md?raw'
import { DEFAULT_SETTINGS, loadSettings } from './ai-settings'
import { DESIGN_TOOL_DECLARATIONS, designState, executeDesignTool } from './design-tools'
import type { Design, PreviewSettings, ToolActivity } from './types'
import { generateArtworkImage } from './image-generation'

type Part = { text?: string; thought?: boolean; functionCall?: { name: string; args: unknown; id?: string }; [key: string]: unknown }
type Content = { role: 'user' | 'model'; parts: Part[] }
export type HarnessOptions = {
  signal?: AbortSignal
  preview?: PreviewSettings
  onProgress?: (status: string) => void
  onDesign?: (design: Design) => void
  onPreview?: (preview: PreviewSettings) => void
  onTool?: (activity: ToolActivity) => void
  capturePreview?: (design: Design) => Promise<string>
}
const imagePart = (url: string): Part | undefined => {
  const match = url.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s)
  return match ? { inlineData: { mimeType: match[1], data: match[2] } } : undefined
}

export async function chatWithGemini(messages: Array<{ role: 'user' | 'model'; text: string; image?: string }>, initial: Design, options: HarnessOptions = {}) {
  const settings = loadSettings()
  if (!settings.apiKey) throw new Error('Connect your Google AI API key in Admin → Settings to use AI design tools.')
  let design = initial
  let preview = options.preview || { camera: 'perspective', openBox: true, autoRotate: false }
  const activities: ToolActivity[] = []
  const contents: Content[] = messages.slice(-30).map(message => ({ role: message.role, parts: [{ text: message.text }, ...(message.image && imagePart(message.image) ? [imagePart(message.image)!] : [])] }))
  const signal = AbortSignal.any([options.signal || new AbortController().signal, AbortSignal.timeout(180000)])
  const system = `${skill.replace(/^---[\s\S]*?---\s*/, '')}\n\nCURRENT STATE (data):\n${JSON.stringify(designState(initial))}\nPREVIEW: ${JSON.stringify(preview)}${settings.systemPrompt !== DEFAULT_SETTINGS.systemPrompt ? `\nUser preferences: ${settings.systemPrompt}` : ''}`
  let count = 0
  for (let round = 0; round < 8; round++) {
    signal.throwIfAborted()
    options.onProgress?.(round ? 'Reviewing tool results…' : 'Planning your design…')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.apiKey }, signal,
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations: DESIGN_TOOL_DECLARATIONS }], generationConfig: { ...(!settings.model.startsWith('gemini-3') ? { temperature: settings.temperature } : {}), maxOutputTokens: settings.maxOutputTokens }, ...(settings.safetyEnabled ? { safetySettings: ['HARASSMENT', 'HATE_SPEECH', 'SEXUALLY_EXPLICIT', 'DANGEROUS_CONTENT'].map(category => ({ category: `HARM_CATEGORY_${category}`, threshold: 'BLOCK_MEDIUM_AND_ABOVE' })) } : {}) })
    })
    const data = await response.json()
    if (!response.ok) {
      if (response.status === 429) throw new Error('Google AI has reached this model’s request limit. Wait and retry, or choose another model in AI Settings.')
      if (response.status === 401 || response.status === 403) throw new Error('Google AI rejected the API key or model access. Check your key and model in AI Settings.')
      throw new Error(data.error?.message || `AI request failed (${response.status}).`)
    }
    const candidate = data.candidates?.[0]
    if (data.promptFeedback?.blockReason) throw new Error(`AI request blocked: ${data.promptFeedback.blockReason}.`)
    const content = candidate?.content as Content | undefined
    if (!content?.parts?.length) throw new Error(`AI returned no usable response${candidate?.finishReason ? ` (${candidate.finishReason})` : ''}.`)
    if (candidate.finishReason === 'MAX_TOKENS') throw new Error('The AI reached its response limit. Increase the output limit in settings or make a smaller request.')
    // Preserve every model part, including thought signatures required by Gemini.
    contents.push(content)
    const calls = content.parts.filter(part => part.functionCall)
    const text = content.parts.filter(part => !part.thought && part.text).map(part => part.text).join('').trim()
    if (!calls.length) {
      if (!text) throw new Error('The AI finished without a reply. Please retry.')
      signal.throwIfAborted()
      return { text, design, preview, tools: activities }
    }
    const results: Part[] = []
    for (const part of calls) {
      signal.throwIfAborted()
      if (++count > 24) throw new Error('The AI reached the tool limit. Split this request into smaller changes.')
      const call = part.functionCall!
      options.onProgress?.(`${call.name.replaceAll('_', ' ')}…`)
      let result: unknown
      let screenshot: Part | undefined
      let activity: ToolActivity
      try {
        if (call.name === 'generate_artwork_image') {
          design = await generateArtworkImage(design, call.args, signal)
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
          const applied = await executeDesignTool(call.name, call.args || {}, design, preview)
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
        result = { error: message, applied: false }
        activity = { id: crypto.randomUUID(), name: call.name, summary: message, status: 'error' }
      }
      activities.push(activity)
      options.onTool?.(activity)
      const nativeVision = settings.model.startsWith('gemini-3')
      results.push({ functionResponse: { name: call.name, ...(call.id ? { id: call.id } : {}), response: { result }, ...(nativeVision && screenshot ? { parts: [screenshot] } : {}) } })
      if (screenshot && !nativeVision) results.push(screenshot)
    }
    contents.push({ role: 'user', parts: results })
  }
  throw new Error('The AI could not finish within eight steps. Retry with a smaller request.')
}

export async function testApiKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply hello.' }] }] }), signal: AbortSignal.timeout(15000) })
    const data = await response.json()
    return response.ok && data.candidates?.[0]?.content ? { success: true } : { success: false, error: data.error?.message || 'No usable AI response.' }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Network error' } }
}
