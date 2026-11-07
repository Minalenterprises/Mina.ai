"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useMinal } from "@/lib/store";
import { useRouter } from "@/lib/router";
import { useChat } from "@/lib/use-chat";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Plus,
  Settings,
  Moon,
  Sun,
  LayoutDashboard,
  ShoppingBag,
  Wand2,
  FileText,
  Trash2,
  Star,
  Search,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { sfx } from "@/lib/sound";

export function CommandPalette() {
  const router = useRouter();
  const open = useMinal((s) => s.commandOpen);
  const setOpen = useMinal((s) => s.openCommand);
  const conversations = useMinal((s) => s.conversations);
  const activeId = useMinal((s) => s.activeId);
  const setActive = useMinal((s) => s.setActive);
  const newConversation = useMinal((s) => s.newConversation);
  const openSettings = useMinal((s) => s.openSettings);
  const openAdmin = useMinal((s) => s.openAdmin);
  const openOrder = useMinal((s) => s.openOrder);
  const toggleTheme = useMinal((s) => s.toggleTheme);
  const theme = useMinal((s) => s.settings.theme);
  const deleteConversation = useMinal((s) => s.deleteConversation);
  const starConversation = useMinal((s) => s.starConversation);
  const setMode = useMinal((s) => s.setMode);
  const mode = useMinal((s) => s.mode);
  const { regenerate } = useChat();

  // keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const close = () => setOpen(false);

  const starred = useMemo(
    () => conversations.filter((c) => c.starred),
    [conversations]
  );
  const recent = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6),
    [conversations]
  );

  return (
    <CommandDialog open={open} onOpenChange={(v) => setOpen(v)}>
      <CommandInput placeholder="Type a command or search sessions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              newConversation();
              close();
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>New Design Session</span>
            <kbd className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-border bg-muted">N</kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              regenerate();
              close();
            }}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4 text-primary" />
            <span>Regenerate last response</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setMode(mode === "plan" ? "ai" : "plan");
              close();
            }}
            className="gap-2"
          >
            {mode === "plan" ? (
              <Wand2 className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4 text-primary" />
            )}
            <span>Switch to {mode === "plan" ? "AI" : "Plan"} mode</span>
          </CommandItem>
          {activeId && (
            <CommandItem
              onSelect={() => {
                sfx.success();
                starConversation(activeId);
                const curr = conversations.find((c) => c.id === activeId);
                toast.success(curr?.starred ? "Removed from starred" : "Added to starred projects");
                close();
              }}
              className="gap-2"
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Toggle Star on Current Project</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Open">
          <CommandItem
            onSelect={() => {
              openSettings(true);
              close();
            }}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Connectors</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/admin");
              close();
            }}
            className="gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Panel</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              openOrder(true);
              close();
            }}
            className="gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Place an Order</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggleTheme();
              close();
            }}
            className="gap-2"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
            <span>Switch to {theme === "light" ? "Dark" : "Light"} theme</span>
          </CommandItem>
        </CommandGroup>

        {starred.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Starred">
              {starred.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => {
                    setActive(c.id);
                    close();
                  }}
                  className="gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="truncate">{c.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Sessions">
              {recent.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => {
                    setActive(c.id);
                    close();
                  }}
                  className="gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate flex-1">{c.title}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => {
              window.open("https://minalenterprises.org", "_blank");
              close();
            }}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Visit Minal Enterprises</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
