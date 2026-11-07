/**
 * Public entry points of the design assistant.
 * `chatWithAI` uses the provider chosen in AI Settings; `chatWithGemini` keeps the original Gemini-only API.
 * The provider adapters live in ./ai/providers and are loaded on demand.
 */
import { runDesignAgent, testProviderKey } from './ai/agent'
import type { ChatMessage, HarnessOptions } from './ai/core'
import type { Design } from './types'

export type { AgentResult, ChatMessage, HarnessOptions } from './ai/core'
export { listProviderModels, testProviderKey } from './ai/agent'

/** Runs the design assistant on the provider selected in AI Settings. */
export function chatWithAI(messages: ChatMessage[], initial: Design, options: HarnessOptions = {}) {
  return runDesignAgent(messages, initial, options)
}

/** Runs the design assistant on Google Gemini, whatever provider is selected. */
export function chatWithGemini(messages: ChatMessage[], initial: Design, options: HarnessOptions = {}) {
  return runDesignAgent(messages, initial, { ...options, provider: 'gemini' })
}

/** Gemini key test (kept for backward compatibility). */
export function testApiKey(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
  return testProviderKey('gemini', apiKey, model)
}
