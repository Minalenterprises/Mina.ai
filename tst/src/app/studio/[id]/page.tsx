import { redirect } from "next/navigation";
import { db } from "@/db";
import { designs } from "@/db/schema";
import { getUserId } from "@/lib/user";
import { eq } from "drizzle-orm";
import StudioClient from "@/components/studio/StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/chat");
  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.userId !== userId || !design.spec) redirect("/chat");
  return <StudioClient design={design as never} />;
}
