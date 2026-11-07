"use client";

import { useState, useRef, useCallback } from "react";
import { fileToAttachment } from "@/lib/store";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Package, Tag, FileImage } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onAttach: (files: Attachment[]) => void;
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

const KIND_META = [
  { kind: "product" as const, label: "Product Photo", icon: Package, hint: "What you're selling" },
  { kind: "logo" as const, label: "Logo", icon: ImageIcon, hint: "Brand logo to apply" },
  { kind: "reference" as const, label: "Reference", icon: FileImage, hint: "Style inspiration" },
];

export function FileUpload({ onAttach, attachments, onRemove }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingKindRef = useRef<Attachment["kind"]>("product");

  const handleFiles = useCallback(
    async (files: FileList | File[], kind: Attachment["kind"]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      const results = await Promise.all(
        arr.map((f) => fileToAttachment(f, kind))
      );
      onAttach(results);
    },
    [onAttach]
  );

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files, pendingKindRef.current);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files, "product");
              }
            }}
            className={cn(
              "w-9 h-9 rounded-lg grid place-items-center border transition",
              dragOver
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
            aria-label="Attach files"
          >
            <Upload className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {KIND_META.map((m) => {
            const Icon = m.icon;
            return (
              <DropdownMenuItem
                key={m.kind}
                onClick={() => {
                  pendingKindRef.current = m.kind;
                  inputRef.current?.click();
                }}
                className="flex items-start gap-2.5 py-2"
              >
                <Icon className="w-4 h-4 mt-0.5 text-white" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium">{m.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {m.hint}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {attachments.length > 0 && (
        <div className="flex gap-1.5 max-w-[280px] overflow-x-auto minal-scroll">
          {attachments.map((a) => {
            const meta = KIND_META.find((m) => m.kind === a.kind);
            const Icon = meta?.icon ?? ImageIcon;
            return (
              <div
                key={a.id}
                className="relative group flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border bg-accent"
              >
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <button
                  onClick={() => onRemove(a.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
