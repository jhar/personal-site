// Fails if a wrangler environment's D1 database_id hasn't been filled in from
// `terraform output` yet. Usage: node scripts/check-database-id.mjs <env>
import { readFileSync } from "node:fs";

const env = process.argv[2];
// wrangler.jsonc only uses whole-line comments.
const source = readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, "");
const databases = JSON.parse(source).env?.[env]?.d1_databases ?? [];
const missing = databases.length === 0 ||
  databases.some((db) => !/^[0-9a-f-]{36}$/.test(db.database_id));

if (missing) {
  console.error(
    `::error::Fill in env.${env}.d1_databases[].database_id in wrangler.jsonc ` +
      `(terraform output database_id in infra/envs/${env === "production" ? "prod" : env}).`,
  );
  process.exit(1);
}
