/** Known Gemini chat models. Any other `gemini-*` id typed into settings is also accepted. */
export type KnownGeminiModel =
  | 'gemini-3.8-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-2.5-flash';
export type GeminiModel = KnownGeminiModel | (string & {});

export type AISettings = {
  apiKey: string;
  model: GeminiModel;
  imageModel: string;
  temperature: number;
  maxOutputTokens: number;
  safetyEnabled: boolean;
  systemPrompt: string;
};

// All of these are on the Gemini API free tier (rate limited) as of Nov 2026.
export const MODEL_OPTIONS: { id: KnownGeminiModel; name: string; description: string }[] = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Recommended: best tool use and design quality, free tier' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', description: 'Previous Flash, fast and reliable' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', description: 'Cheapest and fastest for simple edits' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', description: 'Highest free-tier quota, lighter reasoning' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash (latest alias)', description: 'Always points at Google’s newest Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (legacy)', description: 'Deprecated; Google reroutes it from Dec 1, 2026' },
];

export const DEFAULT_SETTINGS: AISettings = {
  apiKey: '',
  model: 'gemini-3.8-flash',
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

export function loadSettings(): AISettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AISettings>;
      const storedModel = (parsed as { model?: string }).model;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        model: normalizeModel(storedModel),
        // The old built-in prompt was saved with every settings object; treat it as the default, not a user preference.
        systemPrompt: typeof parsed.systemPrompt === 'string' && !parsed.systemPrompt.startsWith('You are Minal, an expert AI packaging design assistant.') ? parsed.systemPrompt : DEFAULT_SETTINGS.systemPrompt,
        imageModel: typeof parsed.imageModel === 'string' && parsed.imageModel.trim() ? parsed.imageModel.trim() : DEFAULT_SETTINGS.imageModel,
      };
    }
  } catch (error) {
    console.warn('Failed to load AI settings from localStorage', error);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AISettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save AI settings to localStorage', error);
  }
}

export function isConfigured(): boolean {
  const settings = loadSettings();
  return settings.apiKey.trim().length > 0;
}
