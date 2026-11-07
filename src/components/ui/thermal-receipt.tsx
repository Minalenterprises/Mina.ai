"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { QrCode, MessageSquare } from "lucide-react";

export type ThermalReceiptItem = Readonly<{
  name: string;
  price: string;
}>;

export type ThermalReceiptCardProps = Readonly<
  {
    storeName?: string;
    storeAddress?: string;
    orderId?: string;
    date?: string;
    items?: readonly ThermalReceiptItem[];
    subtotal?: string;
    tax?: string;
    total?: string;
    footer?: string;
    onChatClick?: () => void;
  } & ComponentPropsWithoutRef<"div">
>;

const defaultItems: readonly ThermalReceiptItem[] = [
  { name: "Rigid Box Prototype (SBS)", price: "Rs 4,500" },
  { name: "Gold Foil Tooling & Stamp", price: "Rs 2,200" },
  { name: "Sample Courier Express", price: "Rs 650" },
];

export const ThermalReceiptCard = forwardRef<HTMLDivElement, ThermalReceiptCardProps>(
  (
    {
      className,
      storeName = "MINAL ENTERPRISES",
      storeAddress = "Bhubbi Wala, Faisalabad · minalenterprises.org",
      orderId = "#MINAL-8924",
      date = "18 SEP 2026 · 19:40",
      items = defaultItems,
      subtotal = "Rs 6,700",
      tax = "Rs 650",
      total = "Rs 7,350",
      footer = "Custom Packaging & Industrial Printing Studio",
      onChatClick,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      data-slot="thermal-receipt-card"
      className={cn("w-full max-w-[320px] font-mono mx-auto", className)}
      {...props}
    >
      <div className="relative bg-[#faf8f2] px-5 py-6 text-neutral-800 shadow-xl rounded-sm border border-neutral-200/80">
        <div
          className="pointer-events-none absolute -top-2 right-0 left-0 h-2"
          style={{
            background: "radial-gradient(circle at 8px 0, transparent 6px, #faf8f2 6px)",
            backgroundSize: "16px 8px",
          }}
        />

        <div data-slot="thermal-receipt-card-header" className="text-center">
          <p className="text-[12px] font-bold tracking-[0.25em] text-neutral-900">{storeName}</p>
          <p className="mt-1 text-[9px] leading-snug text-neutral-500">{storeAddress}</p>
          <p className="mt-2 text-[9px] font-semibold text-neutral-400">
            {orderId} · {date}
          </p>
        </div>

        <div data-slot="thermal-receipt-card-divider" className="my-3 border-t border-dashed border-neutral-300" />

        <div data-slot="thermal-receipt-card-items" className="space-y-1.5">
          {items.map((item) => (
            <div key={item.name} className="flex justify-between gap-2 text-[10px]">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="shrink-0 font-semibold">{item.price}</span>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-dashed border-neutral-300" />

        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{subtotal}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Est. Tax & Delivery</span>
            <span>{tax}</span>
          </div>
          <div className="flex justify-between pt-1.5 text-[12px] font-bold text-neutral-900">
            <span>TOTAL SPEC</span>
            <span>{total}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <QrCode size={40} className="text-neutral-800" aria-hidden />
          <p className="text-center text-[8px] leading-snug text-neutral-500">{footer}</p>
        </div>

        {onChatClick && (
          <button
            type="button"
            onClick={onChatClick}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-sans font-semibold transition shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with Production Team
          </button>
        )}

        <div
          className="pointer-events-none absolute right-0 -bottom-2 left-0 h-2"
          style={{
            background: "radial-gradient(circle at 8px 8px, transparent 6px, #faf8f2 6px)",
            backgroundSize: "16px 8px",
          }}
        />
      </div>
    </div>
  )
);

ThermalReceiptCard.displayName = "ThermalReceiptCard";
export default ThermalReceiptCard;
