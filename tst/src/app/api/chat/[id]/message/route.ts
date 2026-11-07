import { db } from "@/db";
import { conversations, messages, designs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { respond, emptyState } from "@/lib/ai/engine";
import { buildSpec } from "@/lib/design/spec";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getOrCreateUser();
  const [convo] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!convo || convo.userId !== user.id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { content?: string; attachment?: string };
  const content = (body.content ?? "").slice(0, 1500);
  const attachment = typeof body.attachment === "string" && body.attachment.startsWith("data:image/") && body.attachment.length < 4_500_000
    ? body.attachment
    : null;

  if (!content && !attachment) {
    return Response.json({ error: "empty message" }, { status: 400 });
  }

  // persist the user's message
  await db.insert(messages).values({
    conversationId: id,
    role: "user",
    kind: attachment ? "image" : "text",
    content: content || "Shared an image",
    meta: attachment ? { image: attachment } : null,
  });

  // run the conversation engine
  const state = convo.state ?? emptyState();
  const { state: nextState, replies } = await respond(state, content, attachment);

  // if the interview just completed, mint the design + spec
  let designId: string | null = nextState.designId ?? null;
  if (state.step === "finish" && nextState.step === "done") {
    const s = nextState.slots;
    const spec = buildSpec({
      product: s.product ?? "Product",
      brand: s.brand ?? "Your Brand",
      boxType: s.boxType ?? "tuck",
      style: s.style ?? "minimal",
      finish: s.finish ?? "matte",
      paper: s.paper ?? "white",
      quantity: s.quantity ?? 250,
      colors: s.colors ?? ["#141412", "#C6F24E"],
    });
    const [design] = await db
      .insert(designs)
      .values({
        userId: user.id,
        conversationId: id,
        product: s.product ?? "",
        brand: s.brand ?? "",
        boxType: s.boxType ?? "tuck",
        style: s.style ?? "minimal",
        finish: s.finish ?? "matte",
        paper: s.paper ?? "white",
        quantity: s.quantity ?? 250,
        colors: s.colors ?? ["#141412", "#C6F24E"],
        logo: s.logo ?? null,
        tagline: "",
        spec,
        status: "draft",
      })
      .returning();
    designId = design.id;
    nextState.designId = design.id;

    // replace the "drawing up" line with the real plan card message
    replies[replies.length - 1] = {
      role: "assistant",
      kind: "plan",
      content: `Here's your plan for the ${s.brand ?? "brand"} ${boxLabel(spec.boxType)} — fully editable. Tweak anything and the preview repaints itself, then approve when it feels right.`,
      meta: { designId: design.id },
    };
  }

  // keep the conversation title fresh
  const title = nextState.slots.brand
    ? `${nextState.slots.brand} — ${nextState.slots.product ?? "packaging"}`
    : nextState.slots.product
    ? `${nextState.slots.product} packaging`
    : convo.title;

  await db.update(conversations).set({ state: nextState, title }).where(eq(conversations.id, id));

  const inserted = [];
  for (const r of replies) {
    const [row] = await db
      .insert(messages)
      .values({ conversationId: id, role: "assistant", kind: r.kind, content: r.content, meta: r.meta ?? null })
      .returning();
    inserted.push(row);
  }

  return Response.json({ messages: inserted, designId });
}

function boxLabel(id: string) {
  return id === "mailer" ? "mailer box" : id === "sleeve" ? "sleeve box" : id === "rigid" ? "rigid box" : "tuck-end box";
}
