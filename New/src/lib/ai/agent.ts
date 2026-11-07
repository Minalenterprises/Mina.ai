import { DEFAULT_SETTINGS, loadSettings, PROVIDERS, providerCredentials, type ProviderId } from '../ai-settings'
import { DESIGN_TOOL_DECLARATIONS } from '../design-tools'
import type { Design, ToolActivity } from '../types'
import { AIError, toJsonSchema, type AgentResult, type ChatMessage, type HarnessOptions, type ProviderModule, type ToolSpec } from './core'
import { compactHistory, systemPrompt } from './prompt'
import { compactToolResults, runToolCalls } from './tools'

const MAX_ROUNDS = 10
/** Hard limit for one whole request, including every tool round. */
const REQUEST_TIMEOUT = 240000

/** Provider code is only downloaded when that provider is used. */
export function loadProvider(provider: ProviderId): Promise<ProviderModule> {
  switch (provider) {
    case 'openai': return import('./providers/openai')
    case 'anthropic': return import('./providers/anthropic')
    case 'openrouter': return import('./providers/openrouter')
    default: return import('./providers/gemini')
  }
}

let toolSpecs: ToolSpec[] | undefined
/** The studio's tool declarations in both Gemini and standard JSON Schema form (computed once). */
export function designToolSpecs(): ToolSpec[] {
  toolSpecs ??= DESIGN_TOOL_DECLARATIONS.map(tool => {
    const geminiParameters = (tool as { parameters?: unknown }).parameters
    return { name: tool.name, description: tool.description, parameters: toJsonSchema(geminiParameters), geminiParameters }
  })
  return toolSpecs
}

/**
 * Runs the design assistant on the chosen provider: streams the reply, executes tool calls against the design
 * and returns the final text, design and preview. Every provider uses the same tools and the same loop.
 */
export async function runDesignAgent(messages: ChatMessage[], initial: Design, options: HarnessOptions & { provider?: ProviderId } = {}): Promise<AgentResult> {
  const settings = loadSettings()
  const provider = options.provider || settings.provider
  const { apiKey, model } = providerCredentials(settings, provider)
  const name = PROVIDERS[provider].name
  if (!apiKey.trim()) throw new AIError(provider === 'gemini' ? 'Connect your Google AI API key in Admin → Settings to use AI design tools.' : `Connect your ${name} API key in Admin → Settings to use AI design tools.`)
  const history = compactHistory(messages)
  // Every provider requires the conversation to start with a user turn.
  while (history.length && history[0].role !== 'user') history.shift()
  if (!history.length) throw new AIError('Type a message for the AI first.')

  const signal = AbortSignal.any([options.signal || new AbortController().signal, AbortSignal.timeout(REQUEST_TIMEOUT)])
  const mode = options.mode || 'chat'
  let preview = options.preview || { camera: 'perspective', openBox: true, autoRotate: false }
  const extra = settings.systemPrompt.trim() && settings.systemPrompt !== DEFAULT_SETTINGS.systemPrompt ? `\nUser preferences: ${settings.systemPrompt}` : ''
  // Image generation runs on Google; without a Google key the tool is not offered to other providers.
  const tools = designToolSpecs().filter(tool => tool.name !== 'generate_artwork_image' || settings.apiKey.trim())

  options.onProgress?.('Thinking…')
  const module = await loadProvider(provider)
  signal.throwIfAborted()
  const session = module.createSession({ system: systemPrompt(initial, preview, extra, mode), messages: history, tools, settings, apiKey, model: model || PROVIDERS[provider].defaultModel, stream: !!options.onText })

  const state = { design: initial, preview, count: 0 }
  const activities: ToolActivity[] = []
  const results: unknown[] = []
  let repairs = 0
  for (let round = 0; round < MAX_ROUNDS; round++) {
    signal.throwIfAborted()
    options.onProgress?.(round === 0 ? 'Thinking…' : mode === 'magic' ? 'Building…' : 'Refining…')
    let streaming = false
    const turn = await session.turn({
      signal,
      onProgress: options.onProgress,
      onText: options.onText && (text => {
        if (!streaming) { streaming = true; options.onProgress?.('Generating…') }
        options.onText!(text)
      }),
    })
    if (turn.finish === 'malformed') {
      if (repairs++ < 2) { session.addUserText('Your last tool call was malformed. Call the tools again with valid JSON arguments that match the declared schema.'); continue }
      throw new AIError('AI returned no usable response (MALFORMED_FUNCTION_CALL).')
    }
    if (turn.finish === 'continue') continue
    if (!turn.calls.length) {
      if (turn.finish === 'length' && !turn.text) throw new AIError('The AI reached its response limit. Increase the output limit in settings or make a smaller request.')
      if (!turn.text) throw new AIError('The AI finished without a reply. Please retry.')
      signal.throwIfAborted()
      return { text: turn.finish === 'length' ? `${turn.text}…` : turn.text, design: state.design, preview: state.preview, tools: activities }
    }
    // A new round of tools starts: any interim text from this turn is replaced by the next reply.
    if (streaming) options.onText?.('')
    const outcomes = await runToolCalls(turn.calls, state, options, signal)
    preview = state.preview
    for (const outcome of outcomes) {
      activities.push(outcome.activity)
      results.push(outcome.result)
      console.debug('[minal-ai]', provider, outcome.call.name, outcome.activity.status, outcome.activity.summary)
    }
    compactToolResults(results)
    session.addToolResults(outcomes)
  }
  throw new AIError(`The AI could not finish within ${MAX_ROUNDS} steps. Retry with a smaller request.`)
}

/** Tests a provider key (and model access) without running the design tools. */
export async function testProviderKey(provider: ProviderId, apiKey: string, model: string) {
  const module = await loadProvider(provider)
  return module.testKey(apiKey, model)
}

/** Lists chat models the key can use, for the settings dropdown. */
export async function listProviderModels(provider: ProviderId, apiKey: string, signal?: AbortSignal) {
  const module = await loadProvider(provider)
  return module.listModels ? module.listModels(apiKey, signal) : []
}
