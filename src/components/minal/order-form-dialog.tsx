"use client";

import { useState } from "react";
import { useMinal } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ThermalReceiptCard } from "@/components/ui/thermal-receipt";
import type { DesignSpec, OrderInfo } from "@/lib/types";

export function OrderFormDialog() {
  const open = useMinal((s) => s.orderOpen);
  const setOpen = useMinal((s) => s.openOrder);
  const info = useMinal((s) => s.orderInfo);
  const setInfo = useMinal((s) => s.setOrderInfo);
  const placeOrder = useMinal((s) => s.placeOrder);
  const viewerSpec = useMinal((s) => s.viewerSpec);

  const [placedOrder, setPlacedOrder] = useState<{
    id: string;
    spec: DesignSpec;
    info: OrderInfo;
  } | null>(null);

  const valid =
    info.fullName.trim() && info.cnic.trim() && info.address.trim() && info.phone.trim();

  const handleOpenChange = (v: boolean) => {
    if (!v) setPlacedOrder(null);
    setOpen(v);
  };

  const submit = () => {
    if (!valid) {
      toast.error("Please fill all required fields");
      return;
    }
    const conv = useMinal.getState().conversations.find(
      (c) => c.id === useMinal.getState().activeId
    );
    const spec = viewerSpec ?? conv?.currentDesign ?? {
      title: "Bespoke Rigid Lift-Off Box",
      kind: "Rigid Lift-Off Box",
      length: 220,
      width: 150,
      height: 60,
      material: "1200 GSM Greyboard + 157 GSM Artpaper",
      finish: "Soft-Touch Matte + 24K Gold Stamping",
      colors: ["#121316", "#ff6b00"],
    };
    const orderId = placeOrder(spec, info);
    toast.success(`Order placed! ID: ${orderId.slice(0, 8)}. Chat with production team below.`);
    setPlacedOrder({ id: orderId, spec, info });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[92vh] overflow-y-auto minal-scroll">
        {placedOrder ? (
          <div className="py-2 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 grid place-items-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Order Successfully Placed!</h3>
              <p className="text-[12px] text-muted-foreground">
                Official Spec ID:{" "}
                <span className="font-mono font-bold text-foreground">
                  #MINAL-{placedOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
            </div>

            {/* Thermal Receipt Card */}
            <ThermalReceiptCard
              storeName="MINAL ENTERPRISES"
              orderId={`#MINAL-${placedOrder.id.slice(0, 8).toUpperCase()}`}
              items={[
                {
                  name: `${placedOrder.spec.kind || "Box Prototype"} (${placedOrder.info.quantity}x)`,
                  price: `Rs ${(4500 * (placedOrder.info.quantity || 1)).toLocaleString()}`,
                },
                {
                  name: `Material: ${placedOrder.spec.material || "SBS Board"}`,
                  price: "Included",
                },
                {
                  name: `Finish: ${placedOrder.spec.finish || "Matte"} & Die-line`,
                  price: "Included",
                },
              ]}
              subtotal={`Rs ${(4500 * (placedOrder.info.quantity || 1)).toLocaleString()}`}
              tax="Rs 650"
              total={`Rs ${(4500 * (placedOrder.info.quantity || 1) + 650).toLocaleString()}`}
              footer="Custom Packaging & Industrial Printing Studio · Faisalabad"
              onChatClick={() => {
                const text = encodeURIComponent(
                  `Hello Minal Enterprises, I have placed Order #MINAL-${placedOrder.id.slice(0, 8).toUpperCase()} for ${placedOrder.info.quantity}x ${placedOrder.spec.title || placedOrder.spec.kind} (${placedOrder.spec.width}"x${placedOrder.spec.length}"x${placedOrder.spec.height}"). Client: ${placedOrder.info.fullName}. I would like to discuss production and scheduling!`
                );
                window.open(`https://wa.me/923006601081?text=${text}`, "_blank");
              }}
            />

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/923006601081?text=${encodeURIComponent(
                  `Hello Minal Enterprises, I have placed Order #MINAL-${placedOrder.id.slice(0, 8).toUpperCase()} for ${placedOrder.info.quantity}x ${placedOrder.spec.title || placedOrder.spec.kind} (${placedOrder.spec.width}"x${placedOrder.spec.length}"x${placedOrder.spec.height}"). Client: ${placedOrder.info.fullName}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-[12px] shadow-lg shadow-[#25D366]/20 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Production Team on WhatsApp
              </a>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full text-[12px]"
              >
                Done / Back to Studio
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Place an Order
              </DialogTitle>
              <DialogDescription>
                Fill in your details. We&apos;ll manufacture and ship your design.
                Required fields are marked with *.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-2">
              <Field label="Full Name *">
                <Input
                  value={info.fullName}
                  onChange={(e) => setInfo({ fullName: e.target.value })}
                  placeholder="Ali Khan"
                  className="h-9 text-[12px]"
                />
              </Field>
              <Field label="Company">
                <Input
                  value={info.companyName}
                  onChange={(e) => setInfo({ companyName: e.target.value })}
                  placeholder="Minal Enterprises"
                  className="h-9 text-[12px]"
                />
              </Field>
              <Field label="CNIC *">
                <Input
                  value={info.cnic}
                  onChange={(e) => setInfo({ cnic: e.target.value })}
                  placeholder="35202-1234567-8"
                  className="h-9 text-[12px] font-mono"
                />
              </Field>
              <Field label="Phone *">
                <Input
                  value={info.phone}
                  onChange={(e) => setInfo({ phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="h-9 text-[12px] font-mono"
                />
              </Field>
              <Field label="Quantity" className="col-span-2">
                <Input
                  type="number"
                  min={1}
                  value={info.quantity}
                  onChange={(e) => setInfo({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-9 text-[12px]"
                />
              </Field>
              <Field label="Shipping Address *" className="col-span-2">
                <Textarea
                  value={info.address}
                  onChange={(e) => setInfo({ address: e.target.value })}
                  placeholder="House #, Street, Area, City, Province"
                  rows={2}
                  className="text-[12px] resize-none minal-scroll"
                />
              </Field>
              <Field label="Notes" className="col-span-2">
                <Textarea
                  value={info.notes}
                  onChange={(e) => setInfo({ notes: e.target.value })}
                  placeholder="Special instructions, deadline, custom requirements..."
                  rows={2}
                  className="text-[12px] resize-none minal-scroll"
                />
              </Field>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!valid} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Submit Order
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-[9.5px] uppercase tracking-wider mb-1 block">
        {label}
      </Label>
      {children}
    </div>
  );
}
