import Link from "next/link";

export default function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-5 md:px-10 py-5">
        <Link href="/" className="text-[22px] font-bold tracking-tight leading-none flex items-center gap-1">
          minal<span className="text-lime">.</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-mono-label text-ink/70">
          <Link href="/chat" className="hover:text-ink transition-colors">Design chat</Link>
          <Link href="/dashboard" className="hover:text-ink transition-colors">My orders</Link>
          <Link href="/support" className="hover:text-ink transition-colors">Support</Link>
        </nav>
        <Link href="/chat" className="btn btn-ink !py-2.5 !px-5">
          Start a box
        </Link>
      </div>
    </header>
  );
}
