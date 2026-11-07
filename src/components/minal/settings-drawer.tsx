"use client";

import { useMinal } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  KeyRound,
  Plug,
  Zap,
  Moon,
  Sun,
  Thermometer,
  MessageSquare,
  Search,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectorId } from "@/lib/types";

export function SettingsDrawer() {
  const open = useMinal((s) => s.settingsOpen);
  const setOpen = useMinal((s) => s.openSettings);
  const settings = useMinal((s) => s.settings);
  const setConnectorKey = useMinal((s) => s.setConnectorKey);
  const setConnectorModel = useMinal((s) => s.setConnectorModel);
  const toggleConnector = useMinal((s) => s.toggleConnector);
  const setActiveConnector = useMinal((s) => s.setActiveConnector);
  const updateSettings = useMinal((s) => s.updateSettings);
  const toggleTheme = useMinal((s) => s.toggleTheme);

  return (
    <Sheet open={open} onOpenChange={(v) => setOpen(v)}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto minal-scroll p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            Settings & Connectors
          </SheetTitle>
          <SheetDescription>
            Cloud-based AI providers. Pick one active connector — Minal routes
            all your design requests through it.
          </SheetDescription>
        </SheetHeader>

        {/* General */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
            General
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2.5">
              {settings.theme === "dark" ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <div className="text-[12px] font-semibold">
                  {settings.theme === "dark" ? "Dark" : "Light"} theme
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Switch between light and dark mode
                </div>
              </div>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>

          {/* Temperature */}
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-[12px] font-semibold">Creativity</div>
                  <div className="text-[10px] text-muted-foreground">
                    Higher = more creative, lower = more precise
                  </div>
                </div>
              </div>
              <span className="text-[12px] font-mono font-bold text-primary">
                {(settings.temperature ?? 0.75).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.temperature ?? 0.75]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) => updateSettings({ temperature: v[0] })}
            />
          </div>
        </div>

        {/* Connectors */}
        <div className="px-6 py-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
            Cloud Connectors
          </div>
          {Object.values(settings.connectors).map((c) => {
            const isActive = settings.activeConnector === c.id;
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border p-3.5 transition",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg grid place-items-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: c.accent }}
                  >
                    {c.glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">{c.name}</span>
                      {c.connected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                      {isActive && (
                        <span className="text-[8.5px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
                      {c.description}
                    </div>
                  </div>
                  <Switch
                    checked={c.connected}
                    onCheckedChange={() => toggleConnector(c.id as ConnectorId)}
                  />
                </div>

                {c.connected && (
                  <div className="mt-3 space-y-2.5">
                    {/* API key */}
                    <div className="space-y-1">
                      <Label className="text-[9.5px] uppercase tracking-wider flex items-center gap-1">
                        <KeyRound className="w-2.5 h-2.5" /> API Key
                      </Label>
                      <Input
                        type="password"
                        value={c.apiKey ?? ""}
                        onChange={(e) =>
                          setConnectorKey(c.id as ConnectorId, e.target.value)
                        }
                        placeholder={
                          c.id === "ollama"
                            ? "Cloud relay token (optional)"
                            : "sk-..."
                        }
                        className="h-8 text-[11.5px]"
                      />
                    </div>
                    {/* Model picker */}
                    <div className="space-y-1">
                      <Label className="text-[9.5px] uppercase tracking-wider flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" /> Model
                      </Label>
                      <Select
                        value={
                          c.selectedModel && c.models.includes(c.selectedModel)
                            ? c.selectedModel
                            : c.models[0]
                        }
                        onValueChange={(m) =>
                          setConnectorModel(c.id as ConnectorId, m)
                        }
                      >
                        <SelectTrigger className="h-8 text-[11.5px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {c.models.map((m) => (
                            <SelectItem key={m} value={m} className="text-[11px] font-mono">
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => setActiveConnector(c.id as ConnectorId)}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:brightness-110 transition"
                      >
                        <Zap className="w-3 h-3" />
                        Set as active
                      </button>
                    )}
                    {isActive && (
                      <div className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                        <Check className="w-3 h-3" />
                        Currently routing here
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Generation */}
        <div className="px-6 py-4 border-t border-border space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
            Generation
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium">Texture generation</div>
              <div className="text-[10px] text-muted-foreground">
                Auto-generate surface textures for 3D materials
              </div>
            </div>
            <Switch
              checked={settings.textureGen ?? true}
              onCheckedChange={(v) => updateSettings({ textureGen: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium">Auto-plan mode</div>
              <div className="text-[10px] text-muted-foreground">
                Always propose a plan before generating
              </div>
            </div>
            <Switch
              checked={settings.autoPlan ?? true}
              onCheckedChange={(v) => updateSettings({ autoPlan: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-primary" />
              <div>
                <div className="text-[12px] font-medium">Web research</div>
                <div className="text-[10px] text-muted-foreground">
                  Auto-fetch website info when URLs are mentioned
                </div>
              </div>
            </div>
            <Switch
              checked={settings.researchEnabled ?? true}
              onCheckedChange={(v) => updateSettings({ researchEnabled: v })}
            />
          </div>
        </div>

        {/* Custom system prompt */}
        <div className="px-6 py-4 border-t border-border space-y-2">
          <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Custom Instructions
          </Label>
          <Textarea
            value={settings.customSystemPrompt ?? ""}
            onChange={(e) =>
              updateSettings({ customSystemPrompt: e.target.value })
            }
            placeholder="Add custom instructions for the AI (e.g. 'Always use cm instead of inches', 'Prefer minimalist designs', etc.)"
            rows={3}
            className="text-[11.5px] resize-none minal-scroll"
          />
          <p className="text-[9.5px] text-muted-foreground">
            These instructions are appended to the system prompt on every request.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border text-[10px] text-muted-foreground/70">
          Minal AI v3.0 · Built by Minal Enterprises · Cloud-based, no local
          runtime required.
        </div>
      </SheetContent>
    </Sheet>
  );
}
