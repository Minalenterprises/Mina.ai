"use client";

import React from "react";
import type { Attachment } from "@/lib/types";
import { FileText, Image as ImageIcon, Box, FileCode, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function AttachmentPreviewStrip({
  attachments,
  onRemove,
  className,
}: {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  className?: string;
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 overflow-x-auto minal-scroll py-1.5 px-0.5",
        className
      )}
    >
      {attachments.map((att) => {
        const isImg = att.kind === "image" || att.mime.startsWith("image/");
        const isPdf = att.kind === "pdf" || att.name.toLowerCase().endsWith(".pdf");
        const isCad = att.kind === "dieline" || att.name.toLowerCase().match(/\.(dxf|ai|eps|dwg)$/);

        return (
          <div
            key={att.id}
            className="group relative flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-white flex-shrink-0 transition-all max-w-[220px]"
          >
            {/* Visual Icon / Thumbnail */}
            {isImg ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-black flex-shrink-0">
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : isPdf ? (
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-[9px] grid place-items-center flex-shrink-0">
                PDF
              </div>
            ) : isCad ? (
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-[9px] grid place-items-center flex-shrink-0">
                CAD
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-[9px] grid place-items-center flex-shrink-0">
                DOC
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[12px] font-medium text-white truncate leading-tight">
                {att.name}
              </span>
              <span className="text-[10px] text-white/40 font-mono mt-0.5">
                {formatBytes(att.size)}
              </span>
            </div>

            {/* Remove Button */}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(att.id);
                }}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white grid place-items-center transition flex-shrink-0"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
