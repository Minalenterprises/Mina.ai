/** AI provider settings. Gemini keeps its original top-level `apiKey` / `model` fields so older saved settings load unchanged. */
export type BuiltinProviderId = 'gemini' | 'openai' | 'anthropic' | 'openrouter';
/** Providers the user adds themselves are addressed as `custom:<id>`. */
export type CustomProviderId = `custom:${string}`;
export type ProviderId = BuiltinProviderId | CustomProviderId;

/** Wire format a custom provider speaks; each reuses the matching built-in adapter. */
export type ApiFormat = 'openai-chat' | 'anthropic' | 'gemini';
export type AuthStyle = 'bearer' | 'header' | 'none';
export type CustomProvider = {
  id: CustomProviderId;
  name: string;
  /** API root, e.g. https://api.groq.com/openai/v1 (OpenAI-compatible), https://api.anthropic.com (Anthropic), https://generativelanguage.googleapis.com/v1beta (Gemini). */
  baseUrl: string;
  /** Optional: local servers such as Ollama and LM Studio need none. */
  apiKey: string;
  model: string;
  format: ApiFormat;
  auth: { style: AuthStyle; headerName: string; prefix: string };
  extraHeaders: { key: string; value: string }[];
  /** Preset the provider was created from, for display only. */
  preset?: string;
};

/** Known Gemini chat models. Any other `gemini-*` id typed into settings is also accepted. */
export type KnownGeminiModel =
  | 'gemini-3.8-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-2.5-flash';
export type GeminiModel = KnownGeminiModel | (string & {});

export type ProviderCredentials = { apiKey: string; model: string };

export type AISettings = {
  /** Which provider powers the design assistant. */
  provider: ProviderId;
  /** Google AI (Gemini) key. Also used for image generation whatever the chat provider is. */
  apiKey: string;
  /** Gemini chat model. */
  model: GeminiModel;
  /** Keys and models for the other built-in providers. */
  providers: Record<Exclude<BuiltinProviderId, 'gemini'>, ProviderCredentials>;
  /** Providers the user added (any OpenAI-compatible, Anthropic- or Gemini-format endpoint). */
  customProviders: CustomProvider[];
  imageModel: string;
  temperature: number;
  maxOutputTokens: number;
  safetyEnabled: boolean;
  systemPrompt: string;
};

export type ModelOption = { id: string; name: string; description: string };

// All of these are on the Gemini API free tier (rate limited) as of Nov 2026.
export const MODEL_OPTIONS: { id: KnownGeminiModel; name: string; description: string }[] = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Recommended: best tool use and design quality, free tier' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', description: 'Previous Flash, fast and reliable' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', description: 'Cheapest and fastest for simple edits' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', description: 'Highest free-tier quota, lighter reasoning' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash (latest alias)', description: 'Always points at Google’s newest Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (legacy)', description: 'Deprecated; Google reroutes it from Dec 1, 2026' },
];

/** Provider catalogue shown in AI Settings. Model lists are popular tool-calling models as of Nov 2026; any id can be typed. */
export const PROVIDERS: Record<BuiltinProviderId, { name: string; keyPlaceholder: string; keyUrl: string; keyHost: string; defaultModel: string; models: ModelOption[]; note: string }> = {
  gemini: {
    name: 'Google Gemini', keyPlaceholder: 'AIza…', keyUrl: 'https://aistudio.google.com/apikey', keyHost: 'aistudio.google.com', defaultModel: 'gemini-3.8-flash',
    models: MODEL_OPTIONS, note: 'Free tier available. The Google key also powers image artwork generation.',
  },
  openai: {
    name: 'OpenAI', keyPlaceholder: 'sk-…', keyUrl: 'https://platform.openai.com/api-keys', keyHost: 'platform.openai.com', defaultModel: 'gpt-6.1-terra',
    models: [
      { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', description: 'Recommended: fast, strong visual reasoning and tool use' },
      { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol', description: 'Most capable for complex design briefs' },
      { id: 'gpt-6-luna', name: 'GPT-6 Luna', description: 'Cheapest and fastest for quick edits' },
      { id: 'gpt-6-astra', name: 'GPT-6 Astra', description: 'Flagship reasoning model' },
      { id: 'gpt-5.5', name: 'GPT-5.5', description: 'Previous generation flagship' },
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 mini', description: 'Previous generation, low cost' },
    ],
    note: 'Uses the Responses API with streaming and function calling.',
  },
  anthropic: {
    name: 'Anthropic Claude', keyPlaceholder: 'sk-ant-…', keyUrl: 'https://console.anthropic.com/settings/keys', keyHost: 'console.anthropic.com', defaultModel: 'claude-sonnet-5-5',
    models: [
      { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', description: 'Recommended: best balance of speed and intelligence' },
      { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', description: 'Fastest and cheapest' },
      { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', description: 'Highest quality for ambitious designs' },
      { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', description: 'Top capability tier, slower' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (legacy)', description: 'Previous Sonnet' },
    ],
    note: 'Called directly from your browser; your key stays in this browser.',
  },
  openrouter: {
    name: 'OpenRouter', keyPlaceholder: 'sk-or-…', keyUrl: 'https://openrouter.ai/keys', keyHost: 'openrouter.ai', defaultModel: 'anthropic/claude-sonnet-5.5',
    models: [
      { id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5', description: 'Recommended via OpenRouter' },
      { id: 'openai/gpt-6.1-terra', name: 'GPT-6.1 Terra', description: 'OpenAI, fast and visual' },
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Google, fast and inexpensive' },
      { id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', description: 'Fastest Claude' },
      { id: 'x-ai/grok-4.7', name: 'Grok 4.7', description: 'xAI' },
      { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', description: 'Low cost' },
      { id: 'qwen/qwen3.8-flash', name: 'Qwen 3.8 Flash', description: 'Low cost, multilingual' },
      { id: 'mistralai/mistral-large-4-0', name: 'Mistral Large 4', description: 'Mistral flagship' },
    ],
    note: 'One key for hundreds of models. Choose models that support tool calling.',
  },
};
export const PROVIDER_IDS = Object.keys(PROVIDERS) as BuiltinProviderId[];

export const API_FORMATS: { id: ApiFormat; name: string }[] = [
  { id: 'openai-chat', name: 'OpenAI-compatible (Chat Completions)' },
  { id: 'anthropic', name: 'Anthropic Messages' },
  { id: 'gemini', name: 'Google Gemini' },
];

/**
 * Base URLs checked against each provider's official docs (Nov 2026). Presets only prefill the form:
 * models are typed by the user or loaded from the provider's models endpoint.
 */
export const CUSTOM_PRESETS: { id: string; name: string; baseUrl: string; format: ApiFormat; auth: AuthStyle; keyUrl?: string; note?: string }[] = [
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://console.groq.com/keys' },
  { id: 'together', name: 'Together AI', baseUrl: 'https://api.together.ai/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://api.together.ai/settings/api-keys' },
  { id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'xai', name: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://console.x.ai' },
  { id: 'fireworks', name: 'Fireworks AI', baseUrl: 'https://api.fireworks.ai/inference/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://app.fireworks.ai' },
  { id: 'perplexity', name: 'Perplexity (Orchestrator API)', baseUrl: 'https://api.perplexity.ai/orchestrator/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://console.perplexity.ai' },
  { id: 'zai', name: 'Z.ai (GLM)', baseUrl: 'https://api.z.ai/api/paas/v4', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://z.ai/manage-apikey/apikey-list' },
  { id: 'ollama-cloud', name: 'Ollama Cloud', baseUrl: 'https://ollama.com/v1', format: 'openai-chat', auth: 'bearer', keyUrl: 'https://ollama.com/settings/keys', note: 'Ollama recommends keeping cloud keys out of browser apps; the key stays in this browser only.' },
  { id: 'ollama', name: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1', format: 'openai-chat', auth: 'none', note: 'Allow this site in OLLAMA_ORIGINS so the browser can reach it.' },
  { id: 'lmstudio', name: 'LM Studio (local)', baseUrl: 'http://localhost:1234/v1', format: 'openai-chat', auth: 'none', note: 'Turn on “Enable CORS” in LM Studio’s server settings.' },
];

/** Default auth for each format, used when a new custom provider is created or its format changes. */
export function defaultAuth(format: ApiFormat, style?: AuthStyle): CustomProvider['auth'] {
  if (style === 'none') return { style: 'none', headerName: '', prefix: '' };
  if (format === 'anthropic') return { style: 'header', headerName: 'x-api-key', prefix: '' };
  if (format === 'gemini') return { style: 'header', headerName: 'x-goog-api-key', prefix: '' };
  return { style: 'bearer', headerName: '', prefix: '' };
}

export const isCustomProviderId = (id: unknown): id is CustomProviderId => typeof id === 'string' && /^custom:[\w-]{1,64}$/.test(id);

const HEADER_NAME = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/;
export const isValidHeaderName = (name: string) => HEADER_NAME.test(name.trim());

/**
 * Validates and tidies a base URL: http(s) only, no query or fragment, trailing slashes removed,
 * and a pasted full endpoint (…/chat/completions, …/messages, …/models) trimmed back to the API root.
 */
export function normalizeBaseUrl(raw: string, format: ApiFormat = 'openai-chat'): { url: string; error?: string } {
  const value = (raw || '').trim()
  if (!value) return { url: '', error: 'Enter the provider’s base URL.' }
  let parsed: URL
  try { parsed = new URL(value) } catch { return { url: value, error: 'This isn’t a valid URL. It should look like https://api.example.com/v1' } }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { url: value, error: 'Use an http:// or https:// URL.' }
  if (parsed.username || parsed.password) return { url: value, error: 'Put credentials in the API key field, not in the URL.' }
  let path = parsed.pathname.replace(/\/+$/, '')
  path = path.replace(/\/(chat\/completions|completions|responses|messages|models)$/, '')
  if (format === 'anthropic') path = path.replace(/\/v1$/, '')
  return { url: `${parsed.origin}${path}` }
}

/** A custom provider is usable once it has a valid base URL, a model and, unless auth is off, a key. */
export function customProviderReady(provider: CustomProvider): boolean {
  return !normalizeBaseUrl(provider.baseUrl, provider.format).error && !!provider.model.trim() && (provider.auth.style === 'none' || !!provider.apiKey.trim())
}

export function newCustomProvider(preset?: string): CustomProvider {
  const found = CUSTOM_PRESETS.find(item => item.id === preset)
  const format = found?.format || 'openai-chat'
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return { id: `custom:${random}`, name: found?.name || 'My provider', baseUrl: found?.baseUrl || '', apiKey: '', model: '', format, auth: defaultAuth(format, found?.auth), extraHeaders: [], ...(found ? { preset: found.id } : {}) }
}

function migrateCustomProvider(raw: unknown): CustomProvider | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Partial<CustomProvider> & { auth?: Partial<CustomProvider['auth']> }
  if (!isCustomProviderId(value.id)) return undefined
  const format: ApiFormat = API_FORMATS.some(item => item.id === value.format) ? value.format as ApiFormat : 'openai-chat'
  const style: AuthStyle = (['bearer', 'header', 'none'] as const).includes(value.auth?.style as AuthStyle) ? value.auth!.style as AuthStyle : defaultAuth(format).style
  const str = (input: unknown, max = 2000) => typeof input === 'string' ? input.slice(0, max) : ''
  return {
    id: value.id,
    name: str(value.name, 60).trim() || 'Custom provider',
    baseUrl: str(value.baseUrl).trim(),
    apiKey: str(value.apiKey),
    model: str(value.model, 200).trim(),
    format,
    auth: { style, headerName: str(value.auth?.headerName, 100).trim(), prefix: str(value.auth?.prefix, 40) },
    extraHeaders: Array.isArray(value.extraHeaders) ? value.extraHeaders.filter(item => item && typeof item === 'object').slice(0, 20).map(item => ({ key: str(item.key, 100), value: str(item.value) })) : [],
    ...(typeof value.preset === 'string' ? { preset: value.preset } : {}),
  }
}

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.8-flash',
  providers: {
    openai: { apiKey: '', model: PROVIDERS.openai.defaultModel },
    anthropic: { apiKey: '', model: PROVIDERS.anthropic.defaultModel },
    openrouter: { apiKey: '', model: PROVIDERS.openrouter.defaultModel },
  },
  customProviders: [],
  imageModel: 'auto',
  temperature: 1.0,
  maxOutputTokens: 8192,
  safetyEnabled: true,
  systemPrompt: `You are Minal, an expert packaging designer. Be warm, concise and decisive: make sensible design choices with the tools, then explain briefly what changed.`
};

const SETTINGS_KEY = 'minal-ai-settings-v1';

/** Keeps known and custom `gemini-*` ids; maps retired ids to the recommended default. */
export function normalizeModel(model: unknown): GeminiModel {
  if (typeof model !== 'string' || !model.trim()) return DEFAULT_SETTINGS.model;
  const id = model.trim().replace(/^models\//, '');
  if (MODEL_OPTIONS.some(option => option.id === id)) return id;
  if (/^gemini-2\.5-pro|^gemini-1\.|^gemini-2\.0|^gemini-3\.7-flash$|^gemini-3\.5-flash$/.test(id)) return DEFAULT_SETTINGS.model;
  return /^gemini-[\w.-]+$/.test(id) ? id : DEFAULT_SETTINGS.model;
}

/** Accepts any plausible model id for the non-Gemini providers (letters, digits, dots, dashes, slashes, colons). */
export function normalizeProviderModel(provider: Exclude<BuiltinProviderId, 'gemini'>, model: unknown): string {
  if (typeof model !== 'string') return PROVIDERS[provider].defaultModel;
  const id = model.trim();
  return /^[\w.:/-]{2,120}$/.test(id) ? id : PROVIDERS[provider].defaultModel;
}

/** Migrates any saved shape (v1 Gemini-only or current) into the current settings object. */
export function migrateSettings(raw: unknown): AISettings {
  if (!raw || typeof raw !== 'object') return structuredCloneSettings(DEFAULT_SETTINGS);
  const parsed = raw as Partial<AISettings> & { providers?: Partial<Record<string, Partial<ProviderCredentials>>> };
  const providers = { ...structuredCloneSettings(DEFAULT_SETTINGS).providers };
  for (const id of ['openai', 'anthropic', 'openrouter'] as const) {
    const saved = parsed.providers?.[id];
    providers[id] = { apiKey: typeof saved?.apiKey === 'string' ? saved.apiKey : '', model: normalizeProviderModel(id, saved?.model) };
  }
  const seen = new Set<string>()
  const customProviders = (Array.isArray(parsed.customProviders) ? parsed.customProviders : []).map(migrateCustomProvider).filter((item): item is CustomProvider => !!item && !seen.has(item.id) && !!seen.add(item.id))
  const provider = PROVIDER_IDS.includes(parsed.provider as BuiltinProviderId) || customProviders.some(item => item.id === parsed.provider) ? parsed.provider as ProviderId : 'gemini'
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    provider,
    customProviders,
    apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    model: normalizeModel((parsed as { model?: string }).model),
    providers,
    temperature: typeof parsed.temperature === 'number' && Number.isFinite(parsed.temperature) ? Math.min(2, Math.max(0, parsed.temperature)) : DEFAULT_SETTINGS.temperature,
    maxOutputTokens: typeof parsed.maxOutputTokens === 'number' && parsed.maxOutputTokens >= 256 ? Math.min(65536, Math.round(parsed.maxOutputTokens)) : DEFAULT_SETTINGS.maxOutputTokens,
    safetyEnabled: typeof parsed.safetyEnabled === 'boolean' ? parsed.safetyEnabled : DEFAULT_SETTINGS.safetyEnabled,
    // The old built-in prompt was saved with every settings object; treat it as the default, not a user preference.
    systemPrompt: typeof parsed.systemPrompt === 'string' && !parsed.systemPrompt.startsWith('You are Minal, an expert AI packaging design assistant.') ? parsed.systemPrompt : DEFAULT_SETTINGS.systemPrompt,
    imageModel: typeof parsed.imageModel === 'string' && parsed.imageModel.trim() ? parsed.imageModel.trim() : DEFAULT_SETTINGS.imageModel,
  };
}

function structuredCloneSettings(settings: AISettings): AISettings {
  return { ...settings, providers: { openai: { ...settings.providers.openai }, anthropic: { ...settings.providers.anthropic }, openrouter: { ...settings.providers.openrouter } }, customProviders: settings.customProviders.map(item => ({ ...item, auth: { ...item.auth }, extraHeaders: item.extraHeaders.map(header => ({ ...header })) })) };
}

export function loadSettings(): AISettings {
  if (typeof window === 'undefined') {
    return structuredCloneSettings(DEFAULT_SETTINGS);
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return migrateSettings(JSON.parse(stored));
  } catch (error) {
    console.warn('Failed to load AI settings from localStorage', error);
  }
  return structuredCloneSettings(DEFAULT_SETTINGS);
}

export function saveSettings(settings: AISettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save AI settings to localStorage', error);
  }
}

/** The key and model for a provider. */
export function providerCredentials(settings: AISettings, provider: ProviderId = settings.provider): ProviderCredentials {
  if (isCustomProviderId(provider)) {
    const custom = findCustomProvider(settings, provider);
    return { apiKey: custom?.apiKey || '', model: custom?.model || '' };
  }
  return provider === 'gemini' ? { apiKey: settings.apiKey, model: settings.model } : settings.providers[provider];
}

export function findCustomProvider(settings: AISettings, id: ProviderId): CustomProvider | undefined {
  return isCustomProviderId(id) ? settings.customProviders.find(item => item.id === id) : undefined;
}

/** Display name of any provider, built-in or custom. */
export function providerName(settings: AISettings, provider: ProviderId = settings.provider): string {
  if (isCustomProviderId(provider)) return findCustomProvider(settings, provider)?.name || 'Custom provider';
  return PROVIDERS[provider]?.name || 'AI';
}

/** Whether the provider has everything it needs to run (a key for built-ins; URL, model and key-unless-no-auth for custom ones). */
export function providerReady(settings: AISettings, provider: ProviderId = settings.provider): boolean {
  if (isCustomProviderId(provider)) {
    const custom = findCustomProvider(settings, provider);
    return !!custom && customProviderReady(custom);
  }
  return providerCredentials(settings, provider).apiKey.trim().length > 0;
}

/** Returns new settings with one custom provider replaced (or added when new). */
export function withCustomProvider(settings: AISettings, provider: CustomProvider): AISettings {
  const exists = settings.customProviders.some(item => item.id === provider.id);
  return { ...settings, customProviders: exists ? settings.customProviders.map(item => item.id === provider.id ? provider : item) : [...settings.customProviders, provider] };
}

/** Removes a custom provider; the studio falls back to Gemini when it was the active one. */
export function withoutCustomProvider(settings: AISettings, id: CustomProviderId): AISettings {
  return { ...settings, provider: settings.provider === id ? 'gemini' : settings.provider, customProviders: settings.customProviders.filter(item => item.id !== id) };
}

/** Returns new settings with one provider's key or model changed. */
export function withProviderCredentials(settings: AISettings, provider: ProviderId, change: Partial<ProviderCredentials>): AISettings {
  if (isCustomProviderId(provider)) {
    const custom = findCustomProvider(settings, provider);
    return custom ? withCustomProvider(settings, { ...custom, ...change }) : settings;
  }
  if (provider === 'gemini') return { ...settings, ...(change.apiKey !== undefined ? { apiKey: change.apiKey } : {}), ...(change.model !== undefined ? { model: change.model } : {}) };
  return { ...settings, providers: { ...settings.providers, [provider]: { ...settings.providers[provider], ...change } } };
}

export function isConfigured(): boolean {
  return providerReady(loadSettings());
}

/** Display name of the active provider and model, for status labels. */
export function activeProviderLabel(settings: AISettings = loadSettings()): string {
  return `${providerName(settings)} · ${providerCredentials(settings).model}`;
}
