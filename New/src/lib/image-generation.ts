import imageSkill from '../../skills/image-generation/SKILL.md?raw'
import { loadSettings } from './ai-settings'
import type { Design } from './types'
import { getArtwork, newPrintLayer } from './print-artwork'

export async function availableImageModels(apiKey: string, signal?: AbortSignal) {
  const models: { id: string; name: string }[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 5; page++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Could not discover available image models.')
    for (const m of data.models || []) if (/image|nano-banana/i.test(m.name) && m.supportedGenerationMethods?.includes('generateContent')) models.push({ id: m.name.replace(/^models\//, ''), name: m.displayName || m.name })
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
  const score = (id: string) => /nano-banana/.test(id) ? 100 : /3\.1.*flash.*image/.test(id) ? 90 : /3.*flash.*image/.test(id) ? 85 : /3.*pro.*image/.test(id) ? 80 : /2\.5.*flash.*image/.test(id) ? 70 : 10
  return models.sort((a, b) => score(b.id) - score(a.id) || a.id.localeCompare(b.id))
}

export async function generateArtworkImage(design: Design, args: unknown, signal?: AbortSignal): Promise<Design> {
  signal?.throwIfAborted()
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Image generation arguments must be an object.')
  const input = args as Record<string, unknown>
  if (Object.keys(input).some(k => !['prompt', 'editCurrent', 'useReference', 'seamless'].includes(k))) throw new Error('Unsupported image generation option.')
  if (typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 4000) throw new Error('Supply an image prompt up to 4000 characters.')
  for (const k of ['editCurrent', 'useReference', 'seamless']) if (input[k] !== undefined && typeof input[k] !== 'boolean') throw new Error(`${k} must be true or false.`)
  if (input.editCurrent && input.useReference) throw new Error('Choose either the current artwork or an uploaded reference, not both.')
  const settings = loadSettings(), a = getArtwork(design)
  if (!settings.apiKey.trim()) throw new Error('Connect a Google AI key in AI Settings to generate images.')
  if (!/^[a-z0-9.-]+$/.test(settings.imageModel)) throw new Error('Choose a valid image model in AI Settings.')
  const model = settings.imageModel === 'auto' ? (await availableImageModels(settings.apiKey, signal))[0]?.id : settings.imageModel
  if (!model) throw new Error('Your Google project provides no image-generation model. Check model access and billing in Google AI Studio.')
  const reference = input.editCurrent ? a.image : input.useReference ? design.reference : undefined
  if ((input.editCurrent || input.useReference) && !reference) throw new Error('The requested source image is missing. Upload a reference or generate artwork first.')
  const parts: unknown[] = [{ text: `${imageSkill.replace(/^---[\s\S]*?---\s*/, '')}\n\nTask: ${input.prompt}\nOutput: ${input.seamless === false ? 'Square flat illustration.' : 'Square seamless repeating print tile.'}` }]
  const source = reference?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s)
  if (source) parts.push({ inlineData: { mimeType: source[1], data: source[2] } })
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.apiKey },
    signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(150000)]),
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
  })
  const data = await response.json()
  if (response.status === 429) throw new Error('Google image generation has no remaining quota on this key. Check image model quota and billing in Google AI Studio, or choose another image model in AI Settings. Your previous artwork is preserved.')
  if (response.status === 401 || response.status === 403) throw new Error('Google rejected image model access. Check the API key and image model permissions in AI Settings.')
  if (!response.ok) throw new Error(data.error?.message || `Image generation failed (${response.status}). Check image model access and quota in AI Settings.`)
  const blob = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { mimeType?: string; data?: string }; thought?: boolean }) => !p.thought && /^image\/(png|jpeg|webp)$/.test(p.inlineData?.mimeType || '') && p.inlineData?.data)?.inlineData
  if (!blob) throw new Error(`Image generator returned no image${data.promptFeedback?.blockReason ? ` (${data.promptFeedback.blockReason})` : ''}. Your previous artwork is preserved.`)
  let image = `data:${blob.mimeType};base64,${blob.data}`
  if (typeof document !== 'undefined') {
    const img = new Image(); img.src = image; await img.decode()
    const canvas = document.createElement('canvas'), scale = Math.min(1, 1024 / Math.max(img.width, img.height))
    canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    image = canvas.toDataURL('image/webp', .9)
    if (image.length > 800000) image = canvas.toDataURL('image/webp', .72)
    if (image.length > 1400000) throw new Error('This artwork is too large to save locally. Try a simpler image.')
  }
  signal?.throwIfAborted()
  const layers = a.layers.some(l => l.shape === 'image') ? a.layers : [{ ...newPrintLayer('image'), name: 'Generated artwork', width: 100, height: 100 }, ...a.layers]
  return { ...design, artwork: { ...a, enabled: true, image, prompt: input.prompt, layers }, updatedAt: new Date().toISOString() }
}
