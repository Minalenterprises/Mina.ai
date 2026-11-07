import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Conversation,
  Message,
  Mode,
  Settings,
  ConnectorId,
  Connector,
  OrderInfo,
  OrderRecord,
  AdminChatMessage,
  Attachment,
  DesignSpec,
} from "./types";
import { v4 as uuid } from "uuid";

const DEFAULT_CONNECTORS: Record<ConnectorId, Connector> = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "One key, every model. Nvidia Nemotron, Claude, GPT, Gemini via OpenRouter.",
    models: [
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3.5-lightning:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-pro-1.5",
    ],
    connected: true,
    apiKey: "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",
    selectedModel: "nvidia/nemotron-3-ultra-550b-a55b:free",
    accent: "#6366f1",
    glyph: "OR",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o1 reasoning models.",
    models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"],
    connected: false,
    accent: "#10a37f",
    glyph: "AI",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Opus, Haiku — best for nuanced design reasoning.",
    models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    connected: false,
    accent: "#d97757",
    glyph: "CL",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 1.5 Pro / Flash — multimodal, long context.",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
    connected: false,
    accent: "#4285f4",
    glyph: "GE",
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    description: "Mistral Large, Codestral, Pixtral — lean & fast.",
    models: ["mistral-large-latest", "pixtral-12b", "codestral-latest"],
    connected: false,
    accent: "#ff7000",
    glyph: "MI",
  },
  ollama: {
    id: "ollama",
    name: "Ollama Cloud",
    description: "Self-hosted-style open models, served via cloud relay.",
    models: ["llama3.1:70b", "qwen2.5:32b", "deepseek-r1"],
    connected: false,
    accent: "#000000",
    glyph: "OL",
  },
};

const DEFAULT_SETTINGS: Settings = {
  activeConnector: "openrouter",
  connectors: DEFAULT_CONNECTORS,
  textureGen: true,
  autoPlan: true,
  theme: "dark",
  temperature: 0.75,
  customSystemPrompt: "",
  researchEnabled: true,
};

interface MinalState {
  // conversations
  conversations: Conversation[];
  activeId: string | null;

  // ui
  mode: Mode;
  settingsOpen: boolean;
  orderOpen: boolean;
  viewerOpen: boolean;
  viewerSpec: DesignSpec | null;
  adminOpen: boolean;
  commandOpen: boolean;
  sidebarCollapsed: boolean; // desktop collapse
  mobileSidebarOpen: boolean; // mobile drawer

  // settings
  settings: Settings;
  orderInfo: OrderInfo;

  // orders + admin chat
  orders: OrderRecord[];
  adminChat: AdminChatMessage[];

  // actions
  newConversation: () => string;
  setActive: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  starConversation: (id: string, v?: boolean) => void;
  setMode: (m: Mode) => void;

  addMessage: (msg: Omit<Message, "id" | "createdAt">) => string;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  removeMessage: (id: string) => void;

  approvePlan: (conversationId: string, messageId: string) => void;
  revertToDesign: (conversationId: string, index: number) => void;

  openSettings: (v?: boolean) => void;
  openOrder: (v?: boolean) => void;
  openViewer: (spec?: DesignSpec | null) => void;
  openAdmin: (v?: boolean) => void;
  openCommand: (v?: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebar: (v: boolean) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setConnectorKey: (id: ConnectorId, key: string) => void;
  setConnectorModel: (id: ConnectorId, model: string) => void;
  toggleConnector: (id: ConnectorId) => void;
  setActiveConnector: (id: ConnectorId) => void;
  setOrderInfo: (patch: Partial<OrderInfo>) => void;
  toggleTheme: () => void;

  // orders
  placeOrder: (spec: DesignSpec, info: OrderInfo) => string;
  updateOrderStatus: (id: string, status: OrderRecord["status"]) => void;
  deleteOrder: (id: string) => void;

  // admin chat
  sendAdminMessage: (content: string, role?: "user" | "admin") => void;
  markAdminChatRead: (role: "user" | "admin") => void;

  resetAll: () => void;
}

const emptyOrder: OrderInfo = {
  fullName: "",
  companyName: "",
  cnic: "",
  phone: "",
  address: "",
  quantity: 1,
  notes: "",
};

function makeConversation(): Conversation {
  const now = Date.now();
  return {
    id: uuid(),
    title: "New Design Session",
    messages: [],
    mode: "plan",
    createdAt: now,
    updatedAt: now,
  };
}

export const useMinal = create<MinalState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      mode: "plan",
      settingsOpen: false,
      orderOpen: false,
      viewerOpen: false,
      viewerSpec: null,
      adminOpen: false,
      commandOpen: false,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      settings: DEFAULT_SETTINGS,
      orderInfo: emptyOrder,
      orders: [],
      adminChat: [],

      newConversation: () => {
        const c = makeConversation();
        set((s) => ({
          conversations: [c, ...s.conversations],
          activeId: c.id,
          mode: "plan",
        }));
        return c.id;
      },

      setActive: (id) => set({ activeId: id }),

      deleteConversation: (id) =>
        set((s) => {
          const filtered = s.conversations.filter((c) => c.id !== id);
          const newActive =
            s.activeId === id ? filtered[0]?.id ?? null : s.activeId;
          return { conversations: filtered, activeId: newActive };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title: title || c.title } : c
          ),
        })),

      starConversation: (id, v) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? { ...c, starred: v ?? !c.starred }
              : c
          ),
        })),

      setMode: (m) => set({ mode: m }),

      addMessage: (msg) => {
        const id = uuid();
        const full: Message = { ...msg, id, createdAt: Date.now() };
        const activeId = get().activeId;
        if (!activeId) {
          const newId = get().newConversation();
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === newId
                ? {
                    ...c,
                    messages: [...c.messages, full],
                    updatedAt: Date.now(),
                    title:
                      c.messages.length === 0 && msg.role === "user"
                        ? msg.content.slice(0, 48)
                        : c.title,
                  }
                : c
            ),
          }));
          return id;
        }
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: [...c.messages, full],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && msg.role === "user"
                      ? msg.content.slice(0, 48) || c.title
                      : c.title,
                }
              : c
          ),
        }));
        return id;
      },

      updateMessage: (id, patch) => {
        const activeId = get().activeId;
        if (!activeId) return;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === id ? { ...m, ...patch } : m
                  ),
                }
              : c
          ),
        }));
      },

      appendToMessage: (id, chunk) => {
        const activeId = get().activeId;
        if (!activeId) return;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === id
                      ? { ...m, content: m.content + chunk }
                      : m
                  ),
                }
              : c
          ),
        }));
      },

      removeMessage: (id) => {
        const activeId = get().activeId;
        if (!activeId) return;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? { ...c, messages: c.messages.filter((m) => m.id !== id) }
              : c
          ),
        }));
      },

      approvePlan: (conversationId, messageId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  approvedPlan: true,
                  mode: "ai" as Mode,
                  messages: c.messages.map((m) =>
                    m.id === messageId && m.plan
                      ? {
                          ...m,
                          plan: {
                            ...m.plan,
                            items: m.plan.items.map((it) => ({
                              ...it,
                              status: "pending" as const,
                            })),
                          },
                        }
                      : m
                  ),
                }
              : c
          ),
          mode: "ai",
        }));
      },

      revertToDesign: (conversationId, index) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId || !c.designHistory?.[index]) return c;
            return { ...c, currentDesign: c.designHistory[index] };
          }),
        }));
      },

      openSettings: (v) =>
        set((s) => ({ settingsOpen: v ?? !s.settingsOpen })),
      openOrder: (v) => set((s) => ({ orderOpen: v ?? !s.orderOpen })),
      openViewer: (spec) =>
        set((s) => ({
          viewerOpen: spec !== undefined ? !!spec || !s.viewerOpen : !s.viewerOpen,
          viewerSpec: spec !== undefined ? spec : s.viewerSpec,
        })),
      openAdmin: (v) => set((s) => ({ adminOpen: v ?? !s.adminOpen })),
      openCommand: (v) => set((s) => ({ commandOpen: v ?? !s.commandOpen })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileSidebar: (v) => set({ mobileSidebarOpen: v }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setConnectorKey: (id, key) =>
        set((s) => ({
          settings: {
            ...s.settings,
            connectors: {
              ...s.settings.connectors,
              [id]: { ...s.settings.connectors[id], apiKey: key },
            },
          },
        })),

      setConnectorModel: (id, model) =>
        set((s) => ({
          settings: {
            ...s.settings,
            connectors: {
              ...s.settings.connectors,
              [id]: { ...s.settings.connectors[id], selectedModel: model },
            },
          },
        })),

      toggleConnector: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            connectors: {
              ...s.settings.connectors,
              [id]: {
                ...s.settings.connectors[id],
                connected: !s.settings.connectors[id].connected,
              },
            },
          },
        })),

      setActiveConnector: (id) =>
        set((s) => ({ settings: { ...s.settings, activeConnector: id } })),

      setOrderInfo: (patch) =>
        set((s) => ({ orderInfo: { ...s.orderInfo, ...patch } })),

      toggleTheme: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            theme: s.settings.theme === "light" ? "dark" : "light",
          },
        })),

      placeOrder: (spec, info) => {
        const id = uuid();
        const order: OrderRecord = {
          id,
          createdAt: Date.now(),
          status: "pending",
          spec,
          info,
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return id;
      },

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        })),

      deleteOrder: (id) =>
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      sendAdminMessage: (content, role = "user") => {
        const msg: AdminChatMessage = {
          id: uuid(),
          role,
          content,
          createdAt: Date.now(),
          read: false,
        };
        set((s) => ({ adminChat: [...s.adminChat, msg] }));
      },

      markAdminChatRead: (role) =>
        set((s) => ({
          adminChat: s.adminChat.map((m) =>
            m.role === role ? { ...m, read: true } : m
          ),
        })),

      resetAll: () =>
        set({
          conversations: [],
          activeId: null,
          mode: "plan",
          settings: DEFAULT_SETTINGS,
          orderInfo: emptyOrder,
          orders: [],
          adminChat: [],
        }),
    }),
    {
      name: "minal-ai-store-v3",
      partialize: (s) => ({
        conversations: s.conversations.slice(0, 25),
        activeId: s.activeId,
        mode: s.mode,
        settings: s.settings,
        orderInfo: s.orderInfo,
        orders: s.orders.slice(0, 100),
        adminChat: s.adminChat.slice(-200),
      }),
      // Deep-merge persisted settings with defaults so new fields
      // (temperature, customSystemPrompt, researchEnabled, selectedModel)
      // are backfilled for users with older v1/v2 localStorage.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MinalState>;
        const cur = current as MinalState;
        const persistedSettings = (p.settings ?? {}) as Partial<Settings>;
        const defaultConnectors = cur.settings.connectors;
        const persistedConnectors = persistedSettings.connectors ?? {};
        // Merge each connector individually and sanitize selectedModel
        const mergedConnectors = Object.keys(defaultConnectors).reduce(
          (acc, key) => {
            const k = key as ConnectorId;
            const def = defaultConnectors[k];
            const per = persistedConnectors[k] || {};
            const isModelValid =
              per.selectedModel &&
              def.models.includes(per.selectedModel) &&
              !per.selectedModel.includes("llama-3.1-70b");

            acc[k] = {
              ...def,
              ...per,
              selectedModel: isModelValid ? per.selectedModel : def.selectedModel,
              apiKey: per.apiKey || def.apiKey,
              connected: k === "openrouter" ? true : per.connected,
            };
            return acc;
          },
          {} as Record<ConnectorId, Connector>
        );
        return {
          ...cur,
          ...p,
          settings: {
            ...cur.settings,
            ...persistedSettings,
            temperature:
              typeof persistedSettings.temperature === "number"
                ? persistedSettings.temperature
                : cur.settings.temperature,
            customSystemPrompt:
              persistedSettings.customSystemPrompt ??
              cur.settings.customSystemPrompt,
            researchEnabled:
              typeof persistedSettings.researchEnabled === "boolean"
                ? persistedSettings.researchEnabled
                : cur.settings.researchEnabled,
            textureGen:
              typeof persistedSettings.textureGen === "boolean"
                ? persistedSettings.textureGen
                : cur.settings.textureGen,
            autoPlan:
              typeof persistedSettings.autoPlan === "boolean"
                ? persistedSettings.autoPlan
                : cur.settings.autoPlan,
            theme: persistedSettings.theme ?? cur.settings.theme,
            activeConnector:
              persistedSettings.activeConnector ?? cur.settings.activeConnector,
            connectors: mergedConnectors,
          },
        };
      },
    }
  )
);

// Helpers
export function activeConversation(s: MinalState): Conversation | null {
  return s.conversations.find((c) => c.id === s.activeId) ?? null;
}

export function uid() {
  return uuid();
}

export function detectFileKind(file: File): Attachment["kind"] {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    mime.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg") ||
    name.endsWith(".gif")
  ) {
    return "image";
  }
  if (
    name.endsWith(".dxf") ||
    name.endsWith(".ai") ||
    name.endsWith(".eps") ||
    name.endsWith(".dwg") ||
    name.endsWith(".cdr")
  ) {
    return "dieline";
  }
  if (
    mime.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".json") ||
    name.endsWith(".csv") ||
    name.endsWith(".md") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "document";
  }
  return "reference";
}

export function fileToAttachment(
  file: File,
  kind?: Attachment["kind"]
): Promise<Attachment> {
  const detectedKind = kind || detectFileKind(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result);

      // If it's a text-based document, also read text content
      if (
        detectedKind === "document" &&
        (file.type.startsWith("text/") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".md"))
      ) {
        const textReader = new FileReader();
        textReader.onload = () => {
          resolve({
            id: uuid(),
            kind: detectedKind,
            name: file.name,
            dataUrl,
            mime: file.type || "application/octet-stream",
            size: file.size,
            textContent: String(textReader.result).slice(0, 10000), // cap to 10k chars
          });
        };
        textReader.onerror = () => {
          resolve({
            id: uuid(),
            kind: detectedKind,
            name: file.name,
            dataUrl,
            mime: file.type || "application/octet-stream",
            size: file.size,
          });
        };
        textReader.readAsText(file);
      } else {
        resolve({
          id: uuid(),
          kind: detectedKind,
          name: file.name,
          dataUrl,
          mime: file.type || "application/octet-stream",
          size: file.size,
        });
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
