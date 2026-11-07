import { db } from "@/db";
import { supportMessages, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { asc, desc, sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (userId) {
    const rows = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(asc(supportMessages.createdAt))
      .limit(300);
    return Response.json({ messages: rows });
  }
  // one row per user with last message preview
  const rows = await db
    .select({
      userId: supportMessages.userId,
      userName: users.name,
      last: sql<string>`max(${supportMessages.content}) filter (where ${supportMessages.createdAt} = (select max(m2.created_at) from support_messages m2 where m2.user_id = ${supportMessages.userId}))`,
      lastAt: sql<string>`max(${supportMessages.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(supportMessages)
    .innerJoin(users, eq(supportMessages.userId, users.id))
    .groupBy(supportMessages.userId, users.name)
    .orderBy(desc(sql`max(${supportMessages.createdAt})`))
    .limit(100);
  return Response.json({ threads: rows });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { userId?: string; content?: string; senderName?: string };
  if (!body.userId || !body.content?.trim()) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const [msg] = await db
    .insert(supportMessages)
    .values({
      userId: body.userId,
      sender: "admin",
      senderName: (body.senderName ?? "Ayesha (Print Manager)").slice(0, 60),
      content: body.content.trim().slice(0, 800),
    })
    .returning();
  return Response.json({ message: msg });
}
