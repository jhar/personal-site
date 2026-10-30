import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Static export: next/image optimization isn't available, plain <img> is intended.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores(["infra/**/.terraform/**", ".wrangler/**", ".next/**", "out/**", "api/**", "next-env.d.ts", "scripts/deno/**"]),
]);
