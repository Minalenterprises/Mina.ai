import { AIError, errorMessage, type Classified, type ProviderSession, type SessionInit } from '../core'
import { createChatSession } from './chat-completions'

/** OpenRouter adapter: the shared Chat Completions session with OpenRouter's endpoint, headers and error wording. */
const API = 'https://openrouter.ai/api/v1'
const LABEL = 'OpenRouter'

const headers = (apiKey: string) => ({
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

export function createSession(init: SessionInit): ProviderSession {
  return createChatSession(init, { base: API, label: LABEL, headers: () => headers(init.apiKey), classify })
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
