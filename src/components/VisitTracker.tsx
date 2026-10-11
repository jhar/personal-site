"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Replaces the Fresh middleware: records one visit per page view, including
// client-side navigations. Admin pages are skipped, as before.
export default function VisitTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const referrer = previous.current
      ? new URL(previous.current, location.origin).href
      : document.referrer;
    previous.current = pathname;

    const params = new URLSearchParams({ path: pathname, referrer });
    fetch(`/api/visit?${params}`, { keepalive: true, cache: "no-store" })
      .catch(() => {
        // Never let logging break the app
      });
  }, [pathname]);

  return null;
}
