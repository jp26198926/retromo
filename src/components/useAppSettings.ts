"use client";

import { useEffect, useState } from "react";

export type PublicAppSettings = {
  appName: string;
  appDescription: string;
  appIconUrl: string | null;
  faviconUrl: string | null;
  individualPrice: string;
  companyPrice: string;
  anonymousParticipantLimit: number;
};

const DEFAULT: PublicAppSettings = {
  appName: "RetroMo",
  appDescription: "Your online retrospective made easy",
  appIconUrl: null,
  faviconUrl: null,
  individualPrice: "10.00",
  companyPrice: "20.00",
  anonymousParticipantLimit: 50,
};

let cached: PublicAppSettings | null = null;

/**
 * Client hook that fetches the public app settings (app name, icon, prices).
 * Cached in memory so it only fetches once per session.
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<PublicAppSettings>(cached || DEFAULT);
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    if (cached) {
      setSettings(cached);
      setLoaded(true);
      return;
    }
    let active = true;
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          cached = data;
          setSettings(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loaded };
}
