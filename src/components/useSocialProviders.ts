"use client";

import { useEffect, useState } from "react";

type Providers = {
  google: boolean;
  github: boolean;
};

/**
 * Fetches which social login providers are configured.
 * Returns { google: false, github: false } while loading.
 */
export function useSocialProviders() {
  const [providers, setProviders] = useState<Providers>({ google: false, github: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setProviders(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { providers, loaded };
}
