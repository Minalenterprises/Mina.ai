// Minal AI — Core Types

export type Mode = "ai" | "plan" | "sketch" | "agent";

export type ConnectorId =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "gemini"
  | "mistral"
  | "ollama";

export interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  models: string[];
  connected: boolean;
  apiKey?: string;
  selectedModel?: string;
  accent: string;
  glyph: string;
}

export type Role = "user" | "assistant" | "system";

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  custom?: boolean;
}

export type AttachmentKind =
  | "product"
  | "logo"
  | "reference"
  | "image"
  | "pdf"
  | "document"
  | "dieline";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  dataUrl: string;
  mime: string;
  size: number;
  textContent?: string;
  analysis?: string;
}

export interface PlanItem {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "in_progress" | "done";
}

export interface BrandInfo {
  companyName: string;
  tagline: string;
  description: string;
  ingredients: string;
  weight: string;
  barcode: string;
  website: string;
  email: string;
  phone: string;
  social: string[];
  address: string;
  regulatory: string;
}

export interface DesignSpec {
  kind: string;
  title: string;
  width: number;
  length: number;
  height: number;
  material: string;
  finish: string;
  colors: string[];
  textureUrl?: string;
  notes?: string;
  brand?: BrandInfo;
  logoSvg?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  question?: {
    prompt: string;
    options: ChoiceOption[];
    multi?: boolean;
  };
  plan?: {
    title: string;
    summary: string;
    items: PlanItem[];
    spec?: DesignSpec;
  };
  design?: DesignSpec;
  variants?: DesignSpec[]; // multiple design variations
  research?: {
    url: string;
    title: string;
    snippet: string;
  }[];
  pending?: boolean;
}

export interface OrderInfo {
  fullName: string;
  companyName: string;
  cnic: string;
  phone: string;
  email?: string;
  address: string;
  quantity: number;
  notes: string;
}

export interface OrderRecord {
  id: string;
  createdAt: number;
  status: "pending" | "confirmed" | "in_production" | "shipped" | "delivered" | "cancelled";
  spec: DesignSpec;
  info: OrderInfo;
  total?: number;
}

export interface AdminChatMessage {
  id: string;
  role: "user" | "admin";
  content: string;
  createdAt: number;
  read?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: Mode;
  createdAt: number;
  updatedAt: number;
  approvedPlan?: boolean;
  currentDesign?: DesignSpec;
  designHistory?: DesignSpec[];
  starred?: boolean;
}

export interface Settings {
  activeConnector: ConnectorId;
  connectors: Record<ConnectorId, Connector>;
  textureGen: boolean;
  autoPlan: boolean;
  theme: "light" | "dark";
  temperature: number;
  customSystemPrompt: string;
  researchEnabled: boolean;
}

export interface AdminStats {
  totalConversations: number;
  totalMessages: number;
  totalDesigns: number;
  connectedConnectors: number;
  favoriteCount: number;
  avgMessagesPerConv: number;
}
