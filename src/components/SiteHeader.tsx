import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="no-print mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="group flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_rgba(15,107,92,0.28)] transition-transform group-hover:-rotate-3">
          <BookOpenCheck className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="font-display text-2xl font-semibold tracking-tight text-brand-deep">
          Padee
        </span>
      </Link>
      {!compact && (
        <nav className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
          <a href="#how-it-works" className="hidden sm:inline hover:text-brand">
            How it works
          </a>
          <Link
            href="/create"
            className="rounded-2xl bg-accent px-4 py-2.5 text-white shadow-[0_10px_24px_rgba(232,93,59,0.28)] transition hover:bg-accent-deep"
          >
            Create worksheet
          </Link>
        </nav>
      )}
    </header>
  );
}
