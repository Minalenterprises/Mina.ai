"use client";

import React, { useState } from "react";
import { useMinal } from "@/lib/store";
import { useRouter } from "@/lib/router";
import {
  Type,
  PenTool,
  FolderKanban,
  LayoutGrid,
  Bookmark,
  Clock,
  ChevronLeft,
  LogOut,
  Box,
  MessageSquare,
  Trash2,
  X,
  Layers,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sound";

export function Sidebar() {
  const router = useRouter();
  const conversations = useMinal((s) => s.conversations);
  const activeId = useMinal((s) => s.activeId);
  const setActive = useMinal((s) => s.setActive);
  const newConversation = useMinal((s) => s.newConversation);
  const deleteConversation = useMinal((s) => s.deleteConversation);
  const starConversation = useMinal((s) => s.starConversation);
  const openViewer = useMinal((s) => s.openViewer);
  const toggleSidebar = useMinal((s) => s.toggleSidebar);
  const collapsed = useMinal((s) => s.sidebarCollapsed);
  const mobileOpen = useMinal((s) => s.mobileSidebarOpen);
  const setMobileSidebar = useMinal((s) => s.setMobileSidebar);

  // Active view mode in sidebar: "create" | "history" | "gallery" | "project"
  const [activeTab, setActiveTab] = useState<"text" | "sketch" | "project" | "gallery" | "favorites" | "history">("text");

  const handleSelectSession = (id: string) => {
    sfx.click();
    setActive(id);
    setMobileSidebar(false);
    if (router.path !== "/chat") {
      router.push("/chat");
    }
  };

  const handleNewSession = () => {
    sfx.click();
    newConversation();
    setActiveTab("text");
    setMobileSidebar(false);
    if (router.path !== "/chat") {
      router.push("/chat");
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={cn(
          "h-full flex flex-col bg-[#0d0e12] border-r border-white/[0.08] text-white z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none",
          "fixed md:relative inset-y-0 left-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[76px]" : "md:w-[260px]",
          "w-[260px]"
        )}
      >
        {/* 1. Header (Brand + Collapse Button) */}
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <div
            onClick={() => {
              sfx.click();
              router.push("/");
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            {/* Minimal Logo Icon (Image 3 inspired) */}
            <div className="w-8 h-8 rounded-xl bg-white text-black grid place-items-center shadow-md font-bold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="18" r="3" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-extrabold text-[16px] tracking-tight text-white font-sans">
                MINAL<span className="text-white/40 font-normal">.AI</span>
              </span>
            )}
          </div>

          {/* Round collapse toggle button */}
          {!collapsed ? (
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 grid place-items-center text-white/70 hover:text-white transition"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 mx-auto rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 grid place-items-center text-white/70 hover:text-white transition"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebar(false)}
            className="md:hidden w-7 h-7 grid place-items-center rounded-full bg-white/10 text-white/70"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Welcome Back Banner (Image 3 exact replica) */}
        {!collapsed && (
          <div className="px-5 pt-3 pb-4">
            <h2 className="text-[17px] font-bold text-white tracking-tight leading-snug">
              Welcome Back,<br />
              <span className="text-white/90">Sadekur</span>
            </h2>
            <p className="text-[11px] text-white/40 mt-1">
              Last login: 15 jan 2026
            </p>
          </div>
        )}

        {/* 3. Navigation Sections (Create & Main) */}
        <div className="flex-1 overflow-y-auto minal-scroll px-3 space-y-6 pt-1">
          {/* Section: Create */}
          <div>
            {!collapsed && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2 mb-2">
                Create
              </div>
            )}

            <div className="space-y-1.5">
              {/* Active Tab: Text to design (Image 3 replica) */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("text");
                  handleNewSession();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-[12.5px] font-medium text-left relative",
                  activeTab === "text"
                    ? "bg-[#1f222b] text-white shadow-sm border border-white/[0.12]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                )}
                title="Text to Design"
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg grid place-items-center text-xs font-bold",
                  activeTab === "text" ? "bg-white text-black" : "bg-white/10 text-white"
                )}>
                  <Type className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                {!collapsed && (
                  <span className="flex-1 font-medium">Text to design</span>
                )}
                {activeTab === "text" && !collapsed && (
                  <div className="w-1 h-3.5 bg-white rounded-full ml-auto" />
                )}
              </button>

              {/* Sketch to design */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("sketch");
                  openViewer();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-[12.5px] font-medium text-left",
                  activeTab === "sketch"
                    ? "bg-[#1f222b] text-white shadow-sm border border-white/[0.12]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                )}
                title="Sketch to Design"
              >
                <div className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-white">
                  <PenTool className="w-3.5 h-3.5" />
                </div>
                {!collapsed && (
                  <span className="flex-1">Sketch to design</span>
                )}
              </button>
            </div>
          </div>

          {/* Section: Main */}
          <div>
            {!collapsed && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2 mb-2">
                Main
              </div>
            )}

            <div className="space-y-1">
              {/* Project */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("project");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-[12.5px] text-left",
                  activeTab === "project"
                    ? "bg-[#1f222b] text-white border border-[#ff6b00]/30 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <FolderKanban className={cn("w-4 h-4", activeTab === "project" ? "text-[#ff6b00]" : "text-white/60")} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Projects</span>
                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  </div>
                )}
              </button>

              {/* Gallery */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("gallery");
                  router.push("/templates");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-[12.5px] text-left",
                  activeTab === "gallery"
                    ? "bg-[#1f222b] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <LayoutGrid className="w-4 h-4 text-white/60" />
                {!collapsed && <span>Gallery</span>}
              </button>

              {/* Favorites */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("favorites");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-[12.5px] text-left",
                  activeTab === "favorites"
                    ? "bg-[#1f222b] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <Bookmark className="w-4 h-4 text-white/60" />
                {!collapsed && <span>Favorites</span>}
              </button>

              {/* History / Sessions */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("history");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-[12.5px] text-left",
                  activeTab === "history"
                    ? "bg-[#1f222b] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <Clock className="w-4 h-4 text-white/60" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>History</span>
                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Projects manager drawer when project tab is active */}
          {activeTab === "project" && !collapsed && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 text-[10px] text-white/40 font-mono">
                <span>Packaging Projects</span>
                <button
                  onClick={handleNewSession}
                  className="hover:text-[#ff6b00] flex items-center gap-1 text-white/80"
                >
                  <Plus className="w-3 h-3 text-[#ff6b00]" /> New
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto minal-scroll pr-1">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectSession(c.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-[11.5px] cursor-pointer transition border group",
                      c.id === activeId
                        ? "bg-[#1f222b] text-white font-medium border-[#ff6b00]/40 shadow-sm"
                        : "text-white/60 hover:bg-white/5 hover:text-white border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Box className={cn("w-3.5 h-3.5 flex-shrink-0", c.id === activeId ? "text-[#ff6b00]" : "text-white/40")} />
                      <span className="truncate">{c.title || "Untitled Project"}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          starConversation(c.id);
                        }}
                        className={cn(
                          "p-1 transition",
                          c.starred
                            ? "text-[#ff6b00] opacity-100"
                            : "opacity-0 group-hover:opacity-100 hover:text-amber-400 text-white/40"
                        )}
                        title={c.starred ? "Unstar" : "Star"}
                      >
                        <Bookmark className={cn("w-3 h-3", c.starred && "fill-current")} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-white/40 transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorites drawer when favorites tab is active */}
          {activeTab === "favorites" && !collapsed && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 text-[10px] text-white/40 font-mono">
                <span>Starred Projects</span>
                <span className="text-[#ff6b00]">{conversations.filter((c) => c.starred).length}</span>
              </div>
              {conversations.filter((c) => c.starred).length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-white/30">
                  No starred projects yet. Star a project from the Projects or History tab to see it here.
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto minal-scroll pr-1">
                  {conversations.filter((c) => c.starred).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectSession(c.id)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-xl text-[11.5px] cursor-pointer transition border group",
                        c.id === activeId
                          ? "bg-[#1f222b] text-white font-medium border-[#ff6b00]/40 shadow-sm"
                          : "text-white/60 hover:bg-white/5 hover:text-white border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Bookmark className="w-3.5 h-3.5 flex-shrink-0 text-[#ff6b00]" />
                        <span className="truncate">{c.title || "Untitled Project"}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            starConversation(c.id, false);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-400 text-white/40 transition"
                          title="Unstar"
                        >
                          <Bookmark className="w-3 h-3 fill-current" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-white/40 transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History drawer list when history tab is active */}
          {activeTab === "history" && !collapsed && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 text-[10px] text-white/40 font-mono">
                <span>Recent Sessions</span>
                <button
                  onClick={handleNewSession}
                  className="hover:text-white flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              {conversations.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectSession(c.id)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg text-[11.5px] cursor-pointer transition group",
                    c.id === activeId ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="truncate flex-1">{c.title || "Untitled Box"}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        starConversation(c.id);
                      }}
                      className={cn(
                        "p-1 transition",
                        c.starred
                          ? "text-[#ff6b00] opacity-100"
                          : "opacity-0 group-hover:opacity-100 hover:text-amber-400 text-white/40"
                      )}
                      title={c.starred ? "Unstar" : "Star"}
                    >
                      <Bookmark className={cn("w-3 h-3", c.starred && "fill-current")} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-white/40 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Bottom Exit / Profile Icon (Image 3 replica) */}
        <div className="p-3 border-t border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              sfx.pop();
              router.push("/login");
            }}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] grid place-items-center text-white/70 hover:text-white transition"
            title="Log Out / Switch Account"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {!collapsed && (
            <span className="text-[10px] font-mono text-white/30 tracking-wider">
              Minal AI · v5.2
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
