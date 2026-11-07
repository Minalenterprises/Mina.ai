"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatLauncher() {
  const router = useRouter();
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.id) router.replace(`/chat/${d.id}`);
        else if (!cancelled) setErr(true);
      })
      .catch(() => !cancelled && setErr(true));
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="h-[100svh] grid place-items-center bg-paper">
      <div className="text-center">
        <p className="text-4xl font-bold tracking-tight">
          minal<span className="text-lime">.</span>
        </p>
        <p className="font-mono-label text-ink/45 mt-4 flex items-center justify-center gap-2">
          {err ? (
            "Couldn't open a session — refresh to retry"
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-ink typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink typing-dot" style={{ animationDelay: "160ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink typing-dot" style={{ animationDelay: "320ms" }} />
              <span className="ml-2">opening your studio chat</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
