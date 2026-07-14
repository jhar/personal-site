import { Handlers, PageProps } from "$fresh/server.ts";
import LocalTime from "../../islands/LocalTime.tsx";


interface Visit {
  ip: string;
  country: string;
  region: string;
  city: string;
  path: string;
  referrer: string;
  userAgent: string;
  ts: string;
}

export const handler: Handlers<Visit[]> = {
  async GET(req, ctx) {
    const token = Deno.env.get("ADMIN_TOKEN");
    const url = new URL(req.url);

    if (!token || url.searchParams.get("token") !== token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const kv = await Deno.openKv();
    const visits: Visit[] = [];

    for await (const entry of kv.list<Visit>({ prefix: ["visits"] })) {
      visits.push(entry.value);
    }

    visits.sort((a, b) => b.ts.localeCompare(a.ts));

    return ctx.render(visits.slice(0, 500));
  },
};

export default function Visits({ data: visits }: PageProps<Visit[]>) {
  return (
    <div class="dark:text-offwhite max-w-7xl mx-auto w-[92%] pb-20">
      <h1 class="text-2xl mb-6 mt-4">Visits ({visits.length})</h1>
      <div class="overflow-x-auto">
        <table class="w-full text-sm font-mono border-collapse">
          <thead>
            <tr class="text-left border-b border-slate-600">
              <th class="pb-2 pr-4">Time</th>
              <th class="pb-2 pr-4">Path</th>
              <th class="pb-2 pr-4">IP</th>
              <th class="pb-2 pr-4">Location</th>
              <th class="pb-2 pr-4">Referrer</th>
              <th class="pb-2">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v, i) => (
              <tr
                key={i}
                class="border-b border-slate-700 hover:bg-slate-800"
              >
                <td class="py-1.5 pr-4 whitespace-nowrap opacity-70">
                  <LocalTime ts={v.ts} />
                </td>
                <td class="py-1.5 pr-4">{v.path}</td>
                <td class="py-1.5 pr-4 opacity-70">{v.ip}</td>
                <td class="py-1.5 pr-4 whitespace-nowrap">
                  {[v.city, v.region, v.country].filter((x) => x && x !== "unknown").join(", ") || "—"}
                </td>
                <td class="py-1.5 pr-4 max-w-[200px] truncate opacity-70" title={v.referrer || "—"}>
                  {v.referrer || "—"}
                </td>
                <td class="py-1.5 max-w-[300px] truncate opacity-50 text-xs" title={v.userAgent}>
                  {v.userAgent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && (
          <p class="mt-8 opacity-50">No visits recorded yet.</p>
        )}
      </div>
    </div>
  );
}
