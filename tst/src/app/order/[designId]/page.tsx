import { redirect } from "next/navigation";
import { db } from "@/db";
import { designs } from "@/db/schema";
import { getUserId } from "@/lib/user";
import { eq } from "drizzle-orm";
import OrderForm from "@/components/order/OrderForm";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/chat");
  const [design] = await db.select().from(designs).where(eq(designs.id, designId)).limit(1);
  if (!design || design.userId !== userId || !design.spec) redirect("/chat");
  return <OrderForm design={design as never} />;
}
