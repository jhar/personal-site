"use client";

import { ReactNode, useEffect, useState } from "react";
import type { Visit } from "@/lib/visits";

// Same URL as before: /admin/visits?token=<ADMIN_TOKEN>. The page is static;
// the token is checked by the API when data is fetched. ?view= and ?page= keep
// the current tab and page across reloads.

type View = "visits" | "keyboard" | "touch";

const VIEWS: { id: View; label: string }[] = [
  { id: "visits", label: "Visits" },
  { id: "keyboard", label: "Snek-VG keyboard" },
  { id: "touch", label: "Snek-VG touch" },
];

const PER_PAGE = 100;

interface AdminScore {
  rank: number;
  id: string;
  ts: string;
  initials: string;
  score: number;
  input: string;
  city: string;
  country: string;
  ip_hash: string;
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  per: number;
}

type Result<T> =
  | { status: "unauthorized" }
  | { status: "error" }
  | { status: "ok"; data: Page<T> };

function readUrl(): { token: string; view: View; page: number } {
  const q = new URLSearchParams(location.search);
  const view = VIEWS.some((v) => v.id === q.get("view")) ? (q.get("view") as View) : "visits";
  const page = Math.max(1, parseInt(q.get("page") ?? "1", 10) || 1);
  return { token: q.get("token") ?? "", view, page };
}

function apiUrl(view: View, page: number): string {
  const q = new URLSearchParams({ page: String(page), per: String(PER_PAGE) });
  if (view !== "visits") q.set("input", view);
  return `/api/admin/${view === "visits" ? "visits" : "snek"}?${q}`;
}

export default function AdminDashboard() {
  // null until the URL has been read on the client (the page is static).
  const [nav, setNav] = useState<{ token: string; view: View; page: number } | null>(null);
  // The last response, keyed by the URL it came from; anything else is loading.
  const [result, setResult] = useState<{ url: string; result: Result<Visit | AdminScore> } | null>(
    null,
  );

  useEffect(() => {
    const read = () => setNav(readUrl());
    read();
    addEventListener("popstate", read);
    return () => removeEventListener("popstate", read);
  }, []);

  const url = nav && apiUrl(nav.view, nav.page);
  const token = nav?.token;

  useEffect(() => {
    if (!url) return;
    let stale = false;
    const done = (r: Result<Visit | AdminScore>) => !stale && setResult({ url, result: r });
    fetch(url, { headers: { "x-admin-token": token ?? "" }, cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return done({ status: "unauthorized" });
        if (!res.ok) return done({ status: "error" });
        done({ status: "ok", data: await res.json() });
      })
      .catch(() => done({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [url, token]);

  if (!nav) return null;
  const state = result?.url === url ? result.result : { status: "loading" as const };

  const go = (view: View, page = 1) => {
    const q = new URLSearchParams(location.search);
    q.set("view", view);
    q.set("page", String(page));
    history.pushState(null, "", `?${q}`);
    setNav({ ...nav, view, page });
    scrollTo({ top: 0 });
  };

  if (state.status === "unauthorized") {
    return <p className="max-w-7xl mx-auto w-[92%]">Unauthorized</p>;
  }

  const label = VIEWS.find((v) => v.id === nav.view)!.label;
  const data = state.status === "ok" ? state.data : null;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;

  return (
    <div className="max-w-7xl mx-auto w-[92%] pb-20">
      <div role="tablist" aria-label="Admin views" className="flex flex-wrap gap-2 mt-4 mb-6">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={nav.view === v.id}
            onClick={() => go(v.id)}
            className={`border px-3 py-1 rounded text-sm transition-colors ${
              nav.view === v.id
                ? "border-current font-bold"
                : "border-slate-600 opacity-60 hover:opacity-100"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <h1 className="text-2xl mb-6">
        {label}
        {data && ` (${data.total.toLocaleString()})`}
      </h1>

      {state.status === "loading" && <p className="opacity-50">Loading…</p>}
      {state.status === "error" && <p>Couldn&apos;t load {label.toLowerCase()}.</p>}

      {data && (
        <>
          <Pager page={data.page} pages={pages} total={data.total} per={data.per} onGo={(p) => go(nav.view, p)} />
          <div className="overflow-x-auto">
            {nav.view === "visits" ? (
              <VisitsTable visits={data.items as Visit[]} />
            ) : (
              <ScoresTable scores={data.items as AdminScore[]} />
            )}
          </div>
          {data.items.length === 0 && (
            <p className="mt-8 opacity-50">
              {data.total > 0
                ? "Nothing on this page."
                : nav.view === "visits"
                  ? "No visits recorded yet."
                  : `No ${nav.view} scores yet.`}
            </p>
          )}
          {data.items.length > 20 && (
            <Pager page={data.page} pages={pages} total={data.total} per={data.per} onGo={(p) => go(nav.view, p)} />
          )}
        </>
      )}
    </div>
  );
}

function Pager({
  page,
  pages,
  total,
  per,
  onGo,
}: {
  page: number;
  pages: number;
  total: number;
  per: number;
  onGo: (page: number) => void;
}) {
  if (total <= per && page === 1) return null;
  const first = Math.min(total, (page - 1) * per + 1);
  const last = Math.min(total, page * per);
  const btn = "border border-slate-600 px-2 py-0.5 rounded disabled:opacity-30 enabled:hover:border-current";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center gap-2 my-4 text-sm font-mono">
      <button className={btn} disabled={page <= 1} onClick={() => onGo(1)} aria-label="First page">
        «
      </button>
      <button className={btn} disabled={page <= 1} onClick={() => onGo(page - 1)} aria-label="Previous page">
        ‹ Prev
      </button>
      <span className="px-2 opacity-70">
        Page {page} of {pages} · {first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()}
      </span>
      <button className={btn} disabled={page >= pages} onClick={() => onGo(page + 1)} aria-label="Next page">
        Next ›
      </button>
      <button className={btn} disabled={page >= pages} onClick={() => onGo(pages)} aria-label="Last page">
        »
      </button>
    </nav>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={`pb-2 pr-4 ${right ? "text-right" : ""}`}>{children}</th>;
}

function place(...parts: string[]) {
  return parts.filter((x) => x && x !== "unknown").join(", ") || "—";
}

function VisitsTable({ visits }: { visits: Visit[] }) {
  return (
    <table className="w-full text-sm font-mono border-collapse">
      <thead>
        <tr className="text-left border-b border-slate-600">
          <Th>Time</Th>
          <Th>Path</Th>
          <Th>IP</Th>
          <Th>Location</Th>
          <Th>Referrer</Th>
          <th className="pb-2">User Agent</th>
        </tr>
      </thead>
      <tbody>
        {visits.map((v, i) => (
          <tr key={i} className="border-b border-slate-700 hover:bg-slate-800">
            <td className="py-1.5 pr-4 whitespace-nowrap opacity-70">{new Date(v.ts).toLocaleString()}</td>
            <td className="py-1.5 pr-4">{v.path}</td>
            <td className="py-1.5 pr-4 opacity-70">{v.ip}</td>
            <td className="py-1.5 pr-4 whitespace-nowrap">{place(v.city, v.region, v.country)}</td>
            <td className="py-1.5 pr-4 max-w-[200px] truncate opacity-70" title={v.referrer || "—"}>
              {v.referrer || "—"}
            </td>
            <td className="py-1.5 max-w-[300px] truncate opacity-50 text-xs" title={v.userAgent}>
              {v.userAgent}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Every score on the board, not just the public top 10. The IP itself is never
// stored, only a keyed hash, so the same hash means the same IP.
function ScoresTable({ scores }: { scores: AdminScore[] }) {
  return (
    <table className="w-full text-sm font-mono border-collapse tabular-nums">
      <thead>
        <tr className="text-left border-b border-slate-600">
          <Th right>#</Th>
          <Th>Who</Th>
          <Th right>Score</Th>
          <Th>Time</Th>
          <Th>Location</Th>
          <th className="pb-2">IP hash</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((s) => (
          <tr key={s.id} className="border-b border-slate-700 hover:bg-slate-800">
            <td className="py-1.5 pr-4 text-right opacity-70">{s.rank}</td>
            <td className="py-1.5 pr-4 font-bold">{s.initials}</td>
            <td className="py-1.5 pr-4 text-right">{s.score.toLocaleString()}</td>
            <td className="py-1.5 pr-4 whitespace-nowrap opacity-70">{new Date(s.ts).toLocaleString()}</td>
            <td className="py-1.5 pr-4 whitespace-nowrap">{place(s.city, s.country)}</td>
            <td className="py-1.5 opacity-50 text-xs" title={s.ip_hash}>
              {s.ip_hash ? s.ip_hash.slice(0, 12) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
