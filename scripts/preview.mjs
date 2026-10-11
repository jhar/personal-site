// Serves the production build (out/) the way CloudFront will: the same
// extensionless-path rewrite, 404.html for missing files, and /api/* proxied to
// the local API server (started by `npm run preview`).
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, request } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const apiPort = Number(process.env.API_PORT ?? 3001);
const root = "out";

const source = readFileSync("infra/modules/site/cloudfront-function.js", "utf8");
const rewrite = new Function(`${source}; return handler;`)();

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    const upstream = request(
      { port: apiPort, path: req.url, method: req.method, headers: req.headers },
      (apiRes) => {
        res.writeHead(apiRes.statusCode ?? 502, apiRes.headers);
        apiRes.pipe(res);
      },
    );
    upstream.on("error", () => res.writeHead(502).end("API server not running"));
    req.pipe(upstream);
    return;
  }

  const uri = rewrite({ request: { uri: decodeURIComponent(url.pathname) } }).uri;
  let file = join(root, normalize(uri));
  let status = 200;
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    file = join(root, "404.html");
    status = 404;
  }
  res.writeHead(status, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`[preview] http://localhost:${port}`));
