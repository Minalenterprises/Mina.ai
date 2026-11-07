import { isValidHeaderName, normalizeBaseUrl, type CustomProvider } from '../ai-settings'
import { AIError, type Endpoint } from './core'

/** Headers that the browser manages itself or the adapters always set; user values for these are ignored. */
const RESERVED = /^(content-type|content-length|host|origin|referer|cookie|connection|accept-encoding)$/i

/** Turns a saved custom provider into the endpoint the format adapter calls (validated URL, auth and extra headers). */
export function customEndpoint(provider: CustomProvider): Endpoint {
  const { url, error } = normalizeBaseUrl(provider.baseUrl, provider.format)
  if (error) throw new AIError(`${provider.name}: ${error} Fix it in Admin → AI Settings.`)
  // Anthropic-format paths live under /v1; the stored root never includes it.
  const base = provider.format === 'anthropic' ? `${url}/v1` : url
  const label = provider.name.trim() || 'Custom provider'
  return {
    base, label,
    headers: () => {
      const headers: Record<string, string> = {}
      const key = provider.apiKey.trim()
      if (provider.auth.style === 'bearer' && key) headers.Authorization = `Bearer ${key}`
      else if (provider.auth.style === 'header' && key && isValidHeaderName(provider.auth.headerName)) headers[provider.auth.headerName.trim()] = `${provider.auth.prefix}${key}`
      for (const { key: name, value } of provider.extraHeaders) {
        // Invalid names would make fetch throw a confusing "network" error, so they are skipped (the form flags them).
        if (name.trim() && isValidHeaderName(name) && !RESERVED.test(name.trim())) headers[name.trim()] = value
      }
      return headers
    },
  }
}
