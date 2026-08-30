"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { useAdmin } from "@/components/useAdmin";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Public navlinks shown to logged-out visitors.
// FAQ is always shown (per requirement). Features/Plans/Teams are hidden when logged in.
const publicLinks = [
  { href: "/features", label: "Features" },
  { href: "/plans", label: "Plans" },
  { href: "/teams", label: "Teams" },
];
const faqLink = { href: "/faq", label: "FAQ" };

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);

  const loggedIn = !isPending && !!session;
  const userName = session?.user?.name?.trim() || session?.user?.email || "";
  const userImage = session?.user?.image || "";
  const initials =
    userName
      .replace(/@.*$/, "")
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {/* Public links (Features, Plans, Teams) only shown when logged out */}
            {!loggedIn &&
              publicLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {l.label}
                </Link>
              ))}
            {/* FAQ is always visible */}
            <Link
              href={faqLink.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {faqLink.label}
            </Link>
            {/* Admin link only for admins */}
            {loggedIn && isAdmin && (
              <Link
                href="/admin"
                className="rounded-md px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="md">
                  Dashboard
                </Button>
              </Link>
              <Link href="/retro">
                <Button variant="ghost" size="md">
                  My retros
                </Button>
              </Link>
              <Link href="/teams">
                <Button variant="ghost" size="md">
                  Teams
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost" size="md">
                  Billing
                </Button>
              </Link>
              <Link href="/new-retrospective">
                <Button size="md">New retro</Button>
              </Link>
              {/* Profile shortcut (avatar) */}
              <Link
                href="/profile"
                title={`Profile — ${userName}`}
                aria-label="Profile"
                className="ml-1 inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-xs font-semibold text-neutral-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
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
          {/* Public links only when logged out */}
          {!loggedIn &&
            publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {l.label}
              </Link>
            ))}
          {/* FAQ always */}
          <Link
            href={faqLink.href}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {faqLink.label}
          </Link>
          {/* Admin for admins */}
          {loggedIn && isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Admin
            </Link>
          )}
          <div className="border-t border-neutral-200 pt-3">
            {loggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Dashboard
                </Link>
                <Link href="/retro" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  My retros
                </Link>
                <Link href="/teams" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Teams
                </Link>
                <Link href="/billing" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Billing
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100">
                  Profile
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
