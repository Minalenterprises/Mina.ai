import { db } from "@/db";
import { designs, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db
    .select({ design: designs, user: users })
    .from(designs)
    .innerJoin(users, eq(designs.userId, users.id))
    .orderBy(desc(designs.createdAt))
    .limit(200);
  return Response.json({ designs: rows });
}
