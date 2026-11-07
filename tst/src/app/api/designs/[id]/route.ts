import { db } from "@/db";
import { designs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { buildSpec } from "@/lib/design/spec";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getOrCreateUser();
  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.userId !== user.id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ design });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getOrCreateUser();
  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.userId !== user.id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<{
    brand: string; product: string; tagline: string; boxType: string; style: string;
    finish: string; paper: string; quantity: number; colors: string[];
  }>;

  const merged = {
    brand: (body.brand ?? design.brand).toString().slice(0, 60),
    product: (body.product ?? design.product).toString().slice(0, 80),
    tagline: (body.tagline ?? design.tagline).toString().slice(0, 90),
    boxType: (body.boxType ?? design.boxType).toString(),
    style: (body.style ?? design.style).toString(),
    finish: (body.finish ?? design.finish).toString(),
    paper: (body.paper ?? design.paper).toString(),
    quantity: Math.min(100000, Math.max(50, Number(body.quantity ?? design.quantity) || 250)),
    colors: Array.isArray(body.colors) && body.colors.length >= 1 ? body.colors.slice(0, 3) : design.colors,
  };
  const spec = buildSpec(merged);
  const [updated] = await db
    .update(designs)
    .set({ ...merged, spec, updatedAt: new Date() })
    .where(eq(designs.id, id))
    .returning();
  return Response.json({ design: updated });
}
