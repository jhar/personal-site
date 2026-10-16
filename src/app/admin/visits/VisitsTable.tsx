"use client";

import { useEffect, useState } from "react";
import type { Visit } from "@/lib/visits";

type State =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "error" }
  | { status: "ok"; visits: Visit[] };

// Same URL as before: /admin/visits?token=<ADMIN_TOKEN>. The page is static;
// the token is checked by the API when the visits are fetched.
export default function VisitsTable() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token") ?? "";
    fetch("/api/admin/visits", {
      headers: { "x-admin-token": token },
      cache: "no-store",
    })
      .then(async (res) => {
        if (res.status === 401) return setState({ status: "unauthorized" });
        if (!res.ok) return setState({ status: "error" });
        setState({ status: "ok", visits: await res.json() });
      })
      .catch(() => setState({ status: "error" }));
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return <p className="max-w-7xl mx-auto w-[92%]">Unauthorized</p>;
  }
  if (state.status === "error") {
    return <p className="max-w-7xl mx-auto w-[92%]">Couldn&apos;t load visits.</p>;
  }

  const { visits } = state;

  return (
    <div className="max-w-7xl mx-auto w-[92%] pb-20">
      <h1 className="text-2xl mb-6 mt-4">Visits ({visits.length})</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-600">
              <th className="pb-2 pr-4">Time</th>
              <th className="pb-2 pr-4">Path</th>
              <th className="pb-2 pr-4">IP</th>
              <th className="pb-2 pr-4">Location</th>
              <th className="pb-2 pr-4">Referrer</th>
              <th className="pb-2">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v, i) => (
              <tr
                key={i}
                className="border-b border-slate-700 hover:bg-slate-800"
              >
                <td className="py-1.5 pr-4 whitespace-nowrap opacity-70">
                  {new Date(v.ts).toLocaleString()}
                </td>
                <td className="py-1.5 pr-4">{v.path}</td>
                <td className="py-1.5 pr-4 opacity-70">{v.ip}</td>
                <td className="py-1.5 pr-4 whitespace-nowrap">
                  {[v.city, v.region, v.country].filter((x) => x && x !== "unknown").join(", ") || "—"}
                </td>
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
        {visits.length === 0 && (
          <p className="mt-8 opacity-50">No visits recorded yet.</p>
        )}
      </div>
    </div>
  );
}
