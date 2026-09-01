import { useEffect } from "react";
import type { AppSettings } from "../models/types";

function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolvedTheme(settings: AppSettings): "light" | "dark" {
  if (settings.theme === "system") {
    return systemDark() ? "dark" : "light";
  }
  return settings.theme;
}

export function useTheme(settings: AppSettings): void {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const theme = resolvedTheme(settings);
      root.dataset.theme = theme;
      root.dataset.contrast = settings.highContrast ? "high" : "normal";
      root.dataset.motion = settings.reducedMotion ? "reduce" : "system";
      root.style.setProperty("--accent", settings.accentColor);
      const themeColor = theme === "dark" ? "#161410" : settings.accentColor;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", themeColor);
      }
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings]);
}
