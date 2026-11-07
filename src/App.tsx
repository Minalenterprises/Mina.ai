"use client";

import { useState, useEffect } from "react";
import { RouterProvider, useRouter } from "@/lib/router";
import { VantageHome } from "@/components/minal/vantage-home";
import { StudioAssistant } from "@/components/minal/studio-assistant";
import { HeroShowcase } from "@/components/minal/hero-showcase";
import { ChatPanel } from "@/components/minal/chat-panel";
import { StudioPromptBar } from "@/components/minal/studio-prompt-bar";
import { Header } from "@/components/minal/header";
import { StudioMain } from "@/components/minal/studio-main";
import { Sidebar } from "@/components/minal/sidebar";
import { ViewerModal } from "@/components/minal/viewer-modal";
import { SuperAgent } from "@/components/minal/super-agent";
import { ModelSheet } from "@/components/minal/model-sheet";
import { ArtisanChatDialog } from "@/components/minal/artisan-chat-dialog";
import { SettingsDrawer } from "@/components/minal/settings-drawer";
import { OrderFormDialog } from "@/components/minal/order-form-dialog";
import { CommandPalette } from "@/components/minal/command-palette";
import { AdminPanel, AdminView } from "@/components/minal/admin-panel";
import { OnboardingGuide } from "@/components/minal/onboarding-guide";
import { LoginView } from "@/components/minal/login-view";
import { AboutView } from "@/components/minal/about-view";
import { DownloadView } from "@/components/minal/download-view";
import { TemplateLibrary } from "@/components/minal/template-library";
import { VoiceStudioModal } from "@/components/minal/voice-studio-modal";
import { useMinal, activeConversation } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { Toaster } from "sonner";

function AppContent() {
  const router = useRouter();
  const path = router.path;

  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [artisanChatOpen, setArtisanChatOpen] = useState(false);

  const conv = useMinal((s) => activeConversation(s));
  const openViewer = useMinal((s) => s.openViewer);
  const openSettings = useMinal((s) => s.openSettings);
  const newConversation = useMinal((s) => s.newConversation);

  return (
    <div className="min-h-screen w-screen bg-[#090a0e] text-white overflow-x-hidden relative font-sans selection:bg-[#ff6b00] selection:text-black">
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          className: "apple-island-toast",
          duration: 3200,
        }}
      />

      {/* High-Performance 120fps Ambient Glow Layer — Warm Luxury Amber/Orange Sunset Hues */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] bg-[#ff6b00]/[0.038] rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-orange-600/[0.02] rounded-full blur-[130px]" />
      </div>

      {/* Route Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {path === "/" || path === "/home" ? (
          /* 1. Vantage Minimal Landing Page */
          <VantageHome />
        ) : path === "/login" ? (
          /* 2. Minimal Luxury Login / Client Portal */
          <LoginView />
        ) : path === "/about" ? (
          /* 3. Faisalabad Press Heritage */
          <AboutView />
        ) : path === "/admin" ? (
          /* 4. Factory Admin Console */
          <AdminView />
        ) : path === "/download" ? (
          /* 5. Download Hub */
          <DownloadView />
        ) : path === "/chat" || path === "/studio" || path === "/assistant" ? (
          /* 6. Minimal Luxury Packaging Studio matching Image 3 */
          <div className="h-screen w-screen flex overflow-hidden bg-[#090a0e] text-white">
            <Sidebar />
            <StudioMain
              onOpenModelSheet={() => setModelSheetOpen(true)}
              onOpenSettings={() => openSettings(true)}
            />
          </div>
        ) : (
          <VantageHome />
        )}
      </div>

      {/* Global Voice Studio Modal */}
      <VoiceStudioModal />

      {/* Global Packaging Templates Library Modal */}
      <TemplateLibrary
        open={path === "/templates"}
        onClose={() => {
          if (path === "/templates") router.push("/");
        }}
      />

      {/* Global Drawers and Modals */}
      <ViewerModal />
      <SettingsDrawer />
      <OrderFormDialog />
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
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
