import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
          <Link href="/features" className="hover:text-neutral-900">Features</Link>
          <Link href="/plans" className="hover:text-neutral-900">Plans</Link>
          <Link href="/faq" className="hover:text-neutral-900">FAQ</Link>
          <Link href="/new-retrospective" className="hover:text-neutral-900">Create retro</Link>
        </nav>
        <p className="text-xs text-neutral-400">© {new Date().getFullYear()} RetroMo. Built for remote teams.</p>
      </div>
    </footer>
  );
}
