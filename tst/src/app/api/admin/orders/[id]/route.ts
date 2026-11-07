import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "preparing", "shipping", "delivered", "cancelled"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !STATUSES.includes(body.status)) {
    return Response.json({ error: "bad status" }, { status: 400 });
  }
  const [updated] = await db
    .update(orders)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return Response.json({ order: updated });
}
