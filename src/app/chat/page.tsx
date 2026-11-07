import type { Metadata } from "next";
import { ChatApp } from "@/components/minal/chat-app";

export const metadata: Metadata = {
  title: "Chat — Minal AI",
  description: "Chat with Minal AI to design packaging, branding, and product mockups.",
};

export default function ChatPage() {
  return <ChatApp />;
}
