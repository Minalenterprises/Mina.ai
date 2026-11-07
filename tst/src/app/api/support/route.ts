import { db } from "@/db";
import { supportMessages, orders, designs, users } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { eq, asc, desc } from "drizzle-orm";
import { pkr } from "@/lib/design/spec";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateUser();
  const rows = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.userId, user.id))
    .orderBy(asc(supportMessages.createdAt))
    .limit(200);
  return Response.json({ messages: rows });
}

async function botReply(userId: string, text: string): Promise<string> {
  const t = text.toLowerCase();
  if (/^(hi|hello|hey|salam|aoa|assalam)/.test(t) || t.length < 3) {
    return "Salaam! I'm Minal Bot — I can check your order status, explain pricing, track shipments, or fetch a human. What's up?";
  }
  if (/status|where|order|track/.test(t)) {
    const rows = await db
      .select({ order: orders, design: designs })
      .from(orders)
      .innerJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(1);
    if (!rows.length) return "You don't have any orders yet. Design a box in the chat, approve it, and hit Order — then I'll track it right here.";
    const { order, design } = rows[0];
    const map: Record<string, string> = {
      pending: "is in the queue — our team confirms it within a few hours.",
      preparing: "is on the press right now — plates made, sheets printing.",
      shipping: "has left our facility and is on the road to you.",
      delivered: "was delivered. Hope the boxes look beautiful!",
      cancelled: "was cancelled. Ping a human here if this seems wrong.",
    };
    return `Your latest order — ${design.brand || "your brand"} ${design.product || "boxes"} ×${order.quantity.toLocaleString()} — ${map[order.status] ?? "is being processed."} Order #${order.id.slice(0, 8).toUpperCase()}.`;
  }
  if (/price|cost|rate|how much|paisa|paise/.test(t)) {
    return "Rough guide: tuck-end boxes start near Rs 45, mailers Rs 68, sleeves Rs 40, rigid gift boxes Rs 125 per unit at 100 qty. At 1000+ you save ~26%. Your exact quote appears in your design plan.";
  }
  if (/time|long|deliver|shipping|kab/.test(t)) {
    return "Typical timeline: 2 days to finalise and print, then 2–4 days delivery across Pakistan. Karachi, Lahore and Islamabad usually land fastest.";
  }
  if (/cnic/.test(t)) {
    return "We take your CNIC only for the courier's verification slip — it's required for cash-on-delivery shipments in Pakistan and stays private.";
  }
  if (/design|change|edit|color|logo/.test(t)) {
    return "To change a design, go back to your chat, edit the plan card, and re-approve — the 3D preview updates instantly. Logos can be re-uploaded in the chat anytime.";
  }
  if (/human|person|agent|manager|admin|insan|band/.test(t)) {
    return "Noted — I've flagged this thread for Ayesha (print manager). She jumps in during working hours, usually within the hour. Meanwhile, tell me the issue and I'll try first.";
  }
  if (/thank|shukria/.test(t)) {
    return "Anytime. That's literally what I'm here for — box on.";
  }
  return "I might be a bot, but I'm a useful one — ask me about order status, pricing, delivery times, or type \"human\" to pull in the print manager.";
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  const body = (await req.json().catch(() => ({}))) as { content?: string };
  const content = String(body.content ?? "").trim().slice(0, 800);
  if (!content) return Response.json({ error: "empty" }, { status: 400 });

  const name = user.name ?? "You";
  const [userMsg] = await db
    .insert(supportMessages)
    .values({ userId: user.id, sender: "user", senderName: name, content })
    .returning();

  const reply = await botReply(user.id, content);
  const [botMsg] = await db
    .insert(supportMessages)
    .values({ userId: user.id, sender: "bot", senderName: "Minal Bot", content: reply })
    .returning();

  return Response.json({ messages: [userMsg, botMsg] });
}
