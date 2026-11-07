"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/minal/sidebar";
import { Header } from "@/components/minal/header";
import { ChatPanel } from "@/components/minal/chat-panel";
import { InputBar } from "@/components/minal/input-bar";
import { SettingsDrawer } from "@/components/minal/settings-drawer";
import { OrderFormDialog } from "@/components/minal/order-form-dialog";
import { ViewerModal } from "@/components/minal/viewer-modal";
import { CommandPalette } from "@/components/minal/command-palette";
import { AdminPanel } from "@/components/minal/admin-panel";
import { ThemeProvider } from "@/components/minal/theme-provider";
import { OnboardingGuide } from "@/components/minal/onboarding-guide";
import { SuperAgent } from "@/components/minal/super-agent";
import { ModelSheet } from "@/components/minal/model-sheet";
import { ArtisanChatDialog } from "@/components/minal/artisan-chat-dialog";
import { useMinal } from "@/lib/store";

export function ChatApp() {
  const conversations = useMinal((s) => s.conversations);
  const activeId = useMinal((s) => s.activeId);
  const newConversation = useMinal((s) => s.newConversation);

  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [artisanChatOpen, setArtisanChatOpen] = useState(false);

  useEffect(() => {
    if (conversations.length === 0 && !activeId) {
      newConversation();
    }
  }, [conversations.length, activeId, newConversation]);

  return (
    <ThemeProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0b] text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <Header
            onOpenModelSheet={() => setModelSheetOpen(true)}
            onOpenArtisanChat={() => setArtisanChatOpen(true)}
          />
          <ChatPanel />
          <InputBar onOpenModelSheet={() => setModelSheetOpen(true)} />
        </main>
        <SettingsDrawer />
        <OrderFormDialog />
        <ViewerModal />
        <CommandPalette />
        <AdminPanel />
        <OnboardingGuide />
        <SuperAgent showFloatingButton={false} />
        <ModelSheet
          open={modelSheetOpen}
          onClose={() => setModelSheetOpen(false)}
        />
        <ArtisanChatDialog
          open={artisanChatOpen}
          onClose={() => setArtisanChatOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
