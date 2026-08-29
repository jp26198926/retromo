"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "Features" },
  { href: "/plans", label: "Plans" },
  { href: "/faq", label: "FAQ" },
  { href: "/teams", label: "Teams" },
];

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {!isPending && session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="md">
                  Dashboard
                </Button>
              </Link>
              <Link href="/teams">
                <Button variant="ghost" size="md">
                  Teams
                </Button>
              </Link>
              <Link href="/new-retrospective">
                <Button size="md">New retro</Button>
              </Link>
              <button
                onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="md">
                  Sign in
              </Button>
              </Link>
              <Link href="/new-retrospective">
                <Button size="md">Create free retro</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn("border-t border-neutral-200 md:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-neutral-200 pt-3">
            {!isPending && session ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Dashboard
                </Link>
                <Link href="/teams" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Teams
                </Link>
                <Link href="/new-retrospective" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-indigo-600 hover:bg-neutral-100">
                  New retro
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } }); }}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Sign in
                </Link>
                <Link href="/new-retrospective" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-indigo-600 hover:bg-neutral-100">
                  Create free retro
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
