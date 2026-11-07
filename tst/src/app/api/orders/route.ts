import { db } from "@/db";
import { orders, designs, users } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { quote } from "@/lib/design/spec";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function clean(s: unknown, max = 400): string {
  return String(s ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const designId = clean(body.designId, 80);
  const [design] = await db.select().from(designs).where(eq(designs.id, designId)).limit(1);
  if (!design || design.userId !== user.id) {
    return Response.json({ error: "design not found" }, { status: 404 });
  }

  const customerName = clean(body.customerName, 80);
  const phone = clean(body.phone, 24);
  const cnic = clean(body.cnic, 20).replace(/[^\d-]/g, "");
  const address = clean(body.address, 400);
  const city = clean(body.city, 60);
  const notes = clean(body.notes, 500);
  const quantity = Math.min(100000, Math.max(50, Number(body.quantity ?? design.quantity) || design.quantity));

  const errs: string[] = [];
  if (customerName.length < 2) errs.push("Full name is required");
  if (phone.replace(/\D/g, "").length < 10) errs.push("Valid phone number is required");
  if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) errs.push("CNIC must look like 35202-1234567-1");
  if (address.length < 8) errs.push("Complete delivery address is required");
  if (city.length < 2) errs.push("City is required");
  if (errs.length) return Response.json({ error: errs.join(". ") }, { status: 400 });

  const unit = quote(design.boxType, design.finish, quantity);
  const [order] = await db
    .insert(orders)
    .values({
      designId: design.id,
      userId: user.id,
      customerName, phone, cnic, address, city, notes,
      quantity, unitPrice: unit, totalPrice: unit * quantity,
      status: "pending",
    })
    .returning();

  await db.update(designs).set({ status: "ordered", updatedAt: new Date() }).where(eq(designs.id, design.id));
  await db.update(users).set({ name: customerName }).where(eq(users.id, user.id));

  return Response.json({ order });
}

export async function GET() {
  const user = await getOrCreateUser();
  const rows = await db
    .select({ order: orders, design: designs })
    .from(orders)
    .innerJoin(designs, eq(orders.designId, designs.id))
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));
  return Response.json({ orders: rows });
}
