import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { emptyState, greeting } from "@/lib/ai/engine";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getOrCreateUser();
  const [convo] = await db
    .insert(conversations)
    .values({ userId: user.id, state: emptyState() })
    .returning();
  const hi = greeting();
  await db.insert(messages).values({
    conversationId: convo.id,
    role: "assistant",
    kind: hi.kind,
    content: hi.content,
    meta: hi.meta ?? null,
  });
  return Response.json({ id: convo.id });
}

export async function GET() {
  const user = await getOrCreateUser();
  const list = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.createdAt))
    .limit(20);
  return Response.json({ conversations: list });
}
