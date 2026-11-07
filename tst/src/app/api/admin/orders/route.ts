import { db } from "@/db";
import { orders, designs, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db
    .select({ order: orders, design: designs, user: users })
    .from(orders)
    .innerJoin(designs, eq(orders.designId, designs.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(200);
  return Response.json({ orders: rows });
}
