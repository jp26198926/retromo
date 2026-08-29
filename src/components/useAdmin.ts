"use client";

import { useEffect, useState } from "react";

/**
 * Client hook that returns whether the current logged-in user is an admin.
 * Fetches from /api/admin/check (which is safe — only returns a boolean).
 */
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (active) setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { isAdmin, loaded };
}
