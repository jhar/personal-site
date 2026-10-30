// Exports every visit from the old site's Deno KV database as JSON.
//
//   DENO_KV_ACCESS_TOKEN=<token> deno run -A --unstable-kv \
//     scripts/deno/export-kv-visits.ts <kv-connect-url> > visits.json
//
// The KV connect URL and an access token come from the Deno Deploy dashboard
// (the project's KV database settings). Then load the file into DynamoDB with
// `npm run import-visits -- visits.json <table>`.
const url = Deno.args[0];
if (!url) {
  console.error("usage: export-kv-visits.ts <kv-connect-url>");
  Deno.exit(1);
}

const kv = await Deno.openKv(url);
const entries = [];
for await (const entry of kv.list({ prefix: ["visits"] })) {
  entries.push({ key: entry.key, value: entry.value });
}
console.error(`exported ${entries.length} visits`);
console.log(JSON.stringify(entries, null, 2));
