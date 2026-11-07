import { db } from "@/db";
import { conversations, messages, designs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getOrCreateUser();
  const [convo] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!convo || convo.userId !== user.id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  const designRows = await db.select().from(designs).where(eq(designs.conversationId, id));
  return Response.json({ conversation: convo, messages: msgs, designs: designRows });
}
