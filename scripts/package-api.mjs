// Zips the Python Lambda (api/site_api) into api/dist/lambda.zip. No
// third-party packages are bundled: boto3 ships with the python3.13 runtime.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

rmSync("api/dist", { recursive: true, force: true });
mkdirSync("api/dist");
execFileSync("zip", ["-qr", "dist/lambda.zip", "site_api", "-x", "*__pycache__*"], {
  cwd: "api",
  stdio: "inherit",
});
console.log("api/dist/lambda.zip");
