import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export type ChatState = {
  step: string;
  slots: {
    product?: string;
    brand?: string;
    logo?: string;
    colors?: string[];
    paletteOffer?: string[];
    style?: string;
    boxType?: string;
    quantity?: number;
    finish?: string;
    paper?: string;
  };
  designId?: string;
};

export type PanelArt = {
  bg: string;
  ink: string;
  accent: string;
  brand: string;
  product: string;
};

export type DesignSpec = {
  dims: { w: number; h: number; d: number };
  colors: string[];
  style: string;
  boxType: string;
  finish: string;
  paper: string;
  brand: string;
  product: string;
  pattern: string;
  tagline: string;
  unitPrice: number;
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").default("New packaging project").notNull(),
  state: jsonb("state").$type<ChatState>(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull().default("assistant"),
  kind: text("kind").notNull().default("text"),
  content: text("content").notNull().default(""),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const designs = pgTable("designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  product: text("product").notNull().default(""),
  brand: text("brand").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  boxType: text("box_type").notNull().default("tuck"),
  style: text("style").notNull().default("minimal"),
  finish: text("finish").notNull().default("matte"),
  paper: text("paper").notNull().default("white"),
  quantity: integer("quantity").notNull().default(250),
  colors: jsonb("colors").$type<string[]>().notNull().default(["#141412", "#C6F24E"]),
  logo: text("logo"),
  spec: jsonb("spec").$type<DesignSpec>(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  designId: uuid("design_id").references(() => designs.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  cnic: text("cnic").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  notes: text("notes").notNull().default(""),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sender: text("sender").notNull().default("user"),
  senderName: text("sender_name").notNull().default("You"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});
