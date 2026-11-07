import { db } from "@/db";
import { designs, messages } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { eq } from "drizzle-orm";
import { boxTypeName, pkr } from "@/lib/design/spec";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getOrCreateUser();
  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.userId !== user.id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const [updated] = await db
    .update(designs)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(designs.id, id))
    .returning();

  // leave the 3D design card in the chat thread it came from
  if (design.conversationId) {
    const unit = design.spec?.unitPrice ?? 0;
    await db.insert(messages).values({
      conversationId: design.conversationId,
      role: "assistant",
      kind: "design",
      content: `Approved. Your ${boxTypeName(design.boxType)} is production-ready — ${design.quantity.toLocaleString()} units at ${pkr(unit)} each. Spin it, unfold it, and when you're ready, send it to print.`,
      meta: { designId: design.id },
    });
  }
  return Response.json({ design: updated });
}
