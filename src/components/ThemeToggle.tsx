"use client";

import { useSyncExternalStore } from "react";

export type SiteTheme = "dekalog" | "classic";

const STORAGE_KEY = "site-theme";

// Runs in <head> before first paint so a saved "classic" choice doesn't flash.
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${STORAGE_KEY}")==="classic")document.documentElement.dataset.theme="classic"}catch(e){}`;

function readTheme(): SiteTheme {
  return document.documentElement.dataset.theme === "classic" ? "classic" : "dekalog";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function setTheme(theme: SiteTheme) {
  if (theme === "classic") document.documentElement.dataset.theme = "classic";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode: the choice just won't persist.
  }
}

// Switches between the Dekalog theme (default) and the original "classic" one.
export default function ThemeToggle({ className }: { className?: string }) {
  // null while rendering on the server, where the saved choice isn't known.
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);
  const other: SiteTheme = theme === "classic" ? "dekalog" : "classic";

  return (
    <button
      type="button"
      className={className}
      onClick={() => setTheme(other)}
      aria-label={`Switch to the ${other === "classic" ? "classic" : "Dekalog"} theme`}
    >
      {other}
    </button>
  );
}
