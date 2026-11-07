import { redirect } from "next/navigation";
import { db } from "@/db";
import { conversations, messages, designs } from "@/db/schema";
import { getUserId } from "@/lib/user";
import { eq, asc } from "drizzle-orm";
import ChatUI from "@/components/chat/ChatUI";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/chat");
  const [convo] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!convo || convo.userId !== userId) redirect("/chat");

  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  const designRows = await db.select().from(designs).where(eq(designs.conversationId, id));

  return (
    <ChatUI
      convoId={id}
      title={convo.title}
      initialMessages={msgs as never}
      initialDesigns={designRows as never}
    />
  );
}
