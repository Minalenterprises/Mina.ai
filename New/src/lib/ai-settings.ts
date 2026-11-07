export type GeminiModel = 
  | 'gemini-3.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-3.8-flash';

export type AISettings = {
  apiKey: string;
  model: GeminiModel;
  imageModel: string;
  temperature: number;
  maxOutputTokens: number;
  safetyEnabled: boolean;
  systemPrompt: string;
};

export const MODEL_OPTIONS: { id: GeminiModel; name: string; description: string }[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Recommended for creative design conversations',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    description: 'Faster and lighter for simple design edits',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Earlier fast model for existing projects',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Earlier advanced model for existing projects',
  }
];

export const DEFAULT_SETTINGS: AISettings = {
  apiKey: '',
  model: 'gemini-3.8-flash',
  imageModel: 'auto',
  temperature: 1.0,
  maxOutputTokens: 8192,
  safetyEnabled: true,
  systemPrompt: `You are Minal, an expert AI packaging design assistant. You help users create real 3D packaging designs including shopping bags, boxes, canisters, cartons, pouches, and more.

Your capabilities:
- Understand user's product and brand vision
- Suggest optimal packaging structures, materials, and finishes
- Recommend colors, typography, and design elements
- Generate detailed product specifications
- Provide creative direction for packaging that stands out

When responding:
- Be warm, creative, and encouraging
- Ask clarifying questions to understand the vision
- Provide specific, actionable design recommendations
- Suggest dimensions, materials, and finishes based on the product type
- Consider sustainability and practicality
- Keep responses concise but insightful

You can interpret user descriptions and extract: product category, colors, materials, finishes, dimensions, quantities, and design notes. Format structured data as JSON when asked.`
};

const SETTINGS_KEY = 'minal-ai-settings-v1';

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
        model: MODEL_OPTIONS.find(option => option.id === storedModel)?.id ?? DEFAULT_SETTINGS.model,
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
