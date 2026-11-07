import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const USER_COOKIE = "minal_uid";

/** Route-handler only: reads or creates the guest user and sets the cookie. */
export async function getOrCreateUser() {
  const store = await cookies();
  const existing = store.get(USER_COOKIE)?.value;
  if (existing) {
    const [found] = await db.select().from(users).where(eq(users.id, existing)).limit(1);
    if (found) return found;
  }
  const [created] = await db.insert(users).values({}).returning();
  store.set(USER_COOKIE, created.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return created;
}

/** Server-component safe: only reads the cookie, never writes. */
export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(USER_COOKIE)?.value ?? null;
}
