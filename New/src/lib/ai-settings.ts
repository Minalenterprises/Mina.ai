/** AI provider settings. Gemini keeps its original top-level `apiKey` / `model` fields so older saved settings load unchanged. */
export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

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
  /** Keys and models for the other providers. */
  providers: Record<Exclude<ProviderId, 'gemini'>, ProviderCredentials>;
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
export const PROVIDERS: Record<ProviderId, { name: string; keyPlaceholder: string; keyUrl: string; keyHost: string; defaultModel: string; models: ModelOption[]; note: string }> = {
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
export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.8-flash',
  providers: {
    openai: { apiKey: '', model: PROVIDERS.openai.defaultModel },
    anthropic: { apiKey: '', model: PROVIDERS.anthropic.defaultModel },
    openrouter: { apiKey: '', model: PROVIDERS.openrouter.defaultModel },
  },
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
export function normalizeProviderModel(provider: Exclude<ProviderId, 'gemini'>, model: unknown): string {
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
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    provider: PROVIDER_IDS.includes(parsed.provider as ProviderId) ? parsed.provider as ProviderId : 'gemini',
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
  return { ...settings, providers: { openai: { ...settings.providers.openai }, anthropic: { ...settings.providers.anthropic }, openrouter: { ...settings.providers.openrouter } } };
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
  return provider === 'gemini' ? { apiKey: settings.apiKey, model: settings.model } : settings.providers[provider];
}

/** Returns new settings with one provider's key or model changed. */
export function withProviderCredentials(settings: AISettings, provider: ProviderId, change: Partial<ProviderCredentials>): AISettings {
  if (provider === 'gemini') return { ...settings, ...(change.apiKey !== undefined ? { apiKey: change.apiKey } : {}), ...(change.model !== undefined ? { model: change.model } : {}) };
  return { ...settings, providers: { ...settings.providers, [provider]: { ...settings.providers[provider], ...change } } };
}

export function isConfigured(): boolean {
  const settings = loadSettings();
  return providerCredentials(settings).apiKey.trim().length > 0;
}

/** Display name of the active provider and model, for status labels. */
export function activeProviderLabel(settings: AISettings = loadSettings()): string {
  return `${PROVIDERS[settings.provider].name} · ${providerCredentials(settings).model}`;
}
