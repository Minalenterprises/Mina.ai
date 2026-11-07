import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, designs, conversations } from "@/db/schema";
import { getUserId } from "@/lib/user";
import { eq, desc } from "drizzle-orm";
import { ArrowUpRight, CheckCircle2, MessageSquare, Package, Plus, Headset } from "lucide-react";
import Nav from "@/components/Nav";
import { boxTypeName, pkr } from "@/lib/design/spec";

export const dynamic = "force-dynamic";

const STEPS = ["pending", "preparing", "shipping", "delivered"] as const;

function Stepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return <span className="font-mono-label text-[#E23B2E]">cancelled</span>;
  }
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <div className="flex items-center gap-0 w-full max-w-[340px]">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full border ${i <= idx ? "bg-lime border-ink" : "border-ink/25"}`} />
            <span className={`font-mono text-[9px] uppercase tracking-wider ${i <= idx ? "text-ink" : "text-ink/35"}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-1 mb-4 ${i < idx ? "bg-ink" : "bg-ink/15"}`} />}
        </div>
      ))}
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ ordered?: string }>;
}) {
  const { ordered } = await searchParams;
  const userId = await getUserId();
  if (!userId) redirect("/chat");

  const orderRows = await db
    .select({ order: orders, design: designs })
    .from(orders)
    .innerJoin(designs, eq(orders.designId, designs.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const designRows = await db
    .select()
    .from(designs)
    .where(eq(designs.userId, userId))
    .orderBy(desc(designs.createdAt))
    .limit(12);

  const convoRows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt))
    .limit(8);

  return (
    <main className="min-h-[100svh] bg-paper">
      <Nav />
      <div className="max-w-[1100px] mx-auto px-5 md:px-8 pt-28 pb-20">
        {ordered && (
          <div className="mb-8 border border-lime bg-lime/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-ink shrink-0" />
            <p className="text-sm">
              Order placed — our team confirms it within a few hours. Track it below or ping us in{" "}
              <Link href="/support" className="underline underline-offset-2">support</Link>.
            </p>
          </div>
        )}

        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.03em]">Your studio</h1>
          <Link href="/chat" className="btn btn-ink"><Plus size={13} /> New design</Link>
        </div>

        {/* ————— orders ————— */}
        <section className="mb-16">
          <p className="font-mono-label text-ink/45 mb-5">( Orders )</p>
          {orderRows.length === 0 ? (
            <div className="border-t border-b hairline py-12 text-center">
              <p className="text-ink/50 mb-5">No orders yet — design a box, approve it, and send it to print.</p>
              <Link href="/chat" className="btn btn-line">Design my first box</Link>
            </div>
          ) : (
            <div className="border-t hairline">
              {orderRows.map(({ order, design }) => (
                <div key={order.id} className="border-b hairline py-6 grid lg:grid-cols-[1.1fr_1.3fr_auto] gap-5 items-center px-2 md:px-4 -mx-2 md:-mx-4">
                  <div>
                    <p className="font-bold text-lg leading-tight">{design.brand || "Untitled"} — {design.product || "box"}</p>
                    <p className="font-mono-label text-ink/45 mt-1.5">
                      #{order.id.slice(0, 8).toUpperCase()} · {boxTypeName(design.boxType)} · ×{order.quantity.toLocaleString()}
                    </p>
                    <div className="flex gap-1.5 mt-2.5">
                      {design.colors.map((c) => (
                        <span key={c} className="w-4 h-4 rounded-full border hairline" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <Stepper status={order.status} />
                  <div className="flex items-center gap-5 lg:justify-end">
                    <span className="font-bold">{pkr(order.totalPrice)}</span>
                    <Link href={`/studio/${design.id}`} className="w-10 h-10 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ————— designs ————— */}
        <section className="mb-16">
          <p className="font-mono-label text-ink/45 mb-5">( Designs )</p>
          <div className="border-t hairline">
            {designRows.length === 0 && (
              <p className="border-b hairline py-8 text-ink/50 text-sm">Nothing here yet.</p>
            )}
            {designRows.map((d) => (
              <div key={d.id} className="border-b hairline py-4 flex items-center gap-4 px-2 md:px-4 -mx-2 md:-mx-4 hover:bg-ink/[0.03] transition-colors">
                <div className="flex -space-x-1.5">
                  {d.colors.map((c) => (
                    <span key={c} className="w-6 h-6 rounded-full border-2 border-paper" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{d.brand || "Untitled"} — {d.product || "box"}</p>
                  <p className="font-mono-label text-ink/40 mt-0.5">{boxTypeName(d.boxType)} · ×{d.quantity.toLocaleString()}</p>
                </div>
                <span className={`font-mono-label px-3 py-1.5 rounded-full border ${d.status === "ordered" ? "bg-lime border-lime" : d.status === "approved" ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60"}`}>
                  {d.status}
                </span>
                <div className="flex gap-2">
                  {d.status !== "ordered" && (
                    <Link href={`/order/${d.id}`} className="font-mono-label flex items-center gap-1 text-ink/60 hover:text-ink">
                      <Package size={12} /> order
                    </Link>
                  )}
                  <Link href={`/studio/${d.id}`} className="font-mono-label flex items-center gap-1 text-ink/60 hover:text-ink">
                    preview <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ————— conversations + support ————— */}
        <div className="grid md:grid-cols-2 gap-10">
          <section>
            <p className="font-mono-label text-ink/45 mb-5">( Design chats )</p>
            <div className="border-t hairline">
              {convoRows.map((c) => (
                <Link key={c.id} href={`/chat/${c.id}`}
                  className="border-b hairline py-4 flex items-center gap-3 group px-2 md:px-4 -mx-2 md:-mx-4 hover:bg-ink hover:text-paper transition-colors">
                  <MessageSquare size={15} className="text-ink/40 group-hover:text-lime shrink-0" />
                  <span className="flex-1 truncate font-medium">{c.title}</span>
                  <ArrowUpRight size={14} className="opacity-40 group-hover:rotate-45 transition-transform" />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <p className="font-mono-label text-ink/45 mb-5">( Help )</p>
            <div className="border hairline rounded-2xl p-6 bg-ink text-paper">
              <p className="font-bold text-xl mb-2">Stuck on something?</p>
              <p className="text-paper/60 text-sm mb-5 leading-relaxed">
                Chat with the print team or Minal Bot — order status, pricing, design changes, delivery questions.
              </p>
              <Link href="/support" className="btn btn-lime"><Headset size={13} /> Open support chat</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
