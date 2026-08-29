"use client";

import Link from "next/link";
import { useAppSettings } from "@/components/useAppSettings";
import { useEffect, useState } from "react";

export function Logo({ className = "" }: { className?: string }) {
  const { settings } = useAppSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const appName = settings.appName || "RetroMo";
  // Render the default "RetroMo" branding initially to avoid hydration mismatch,
  // then switch to the admin-configured name after mount.
  const displayName = mounted ? appName : "RetroMo";

  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-lg ${className}`}>
      {mounted && settings.appIconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.appIconUrl}
          alt={displayName}
          className="h-8 w-8 rounded-lg object-cover"
        />
      ) : (
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9" />
            <path d="M3 4v5h5" />
            <path d="M12 7v5l3 3" />
          </svg>
        </span>
      )}
      <span>
        {displayName.startsWith("Retro") ? (
          <>
            Retro<span className="text-indigo-600">{displayName.slice(5) || "Mo"}</span>
          </>
        ) : (
          displayName
        )}
      </span>
    </Link>
  );
}
