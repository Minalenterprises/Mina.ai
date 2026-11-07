import { redirect } from "next/navigation";
import { getUserId } from "@/lib/user";
import SupportChat from "@/components/support/SupportChat";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const userId = await getUserId();
  if (!userId) redirect("/chat");
  return <SupportChat />;
}
