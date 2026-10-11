"""Local stand-in for CloudFront + Lambda.

`npm run dev` starts this alongside `next dev`, which proxies /api/* here.
Visits are kept in memory unless DYNAMODB_ENDPOINT points at DynamoDB Local.
"""

import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from site_api.app import Deps, Request, handle_request
from site_api.store import DynamoVisitStore, MemoryVisitStore


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def make_store():
    endpoint = os.environ.get("DYNAMODB_ENDPOINT")
    table = os.environ.get("VISITS_TABLE", "personal-site-local-visits")
    if not endpoint:
        print("[api] visits kept in memory (set DYNAMODB_ENDPOINT to use DynamoDB Local)")
        return MemoryVisitStore()

    import boto3

    client = boto3.client("dynamodb", endpoint_url=endpoint)
    try:
        client.create_table(
            TableName=table,
            BillingMode="PAY_PER_REQUEST",
            AttributeDefinitions=[
                {"AttributeName": "pk", "AttributeType": "S"},
                {"AttributeName": "sk", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"},
            ],
        )
        print(f"[api] created table {table}")
    except client.exceptions.ResourceInUseException:
        pass
    print(f"[api] visits stored in DynamoDB Local at {endpoint}")
    return DynamoVisitStore(table, endpoint)


def main() -> None:
    load_env_file(Path(__file__).resolve().parent.parent / ".env.local")
    # Dummy credentials are enough for DynamoDB Local.
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "local")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "local")
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

    port = int(os.environ.get("API_PORT", "3001"))
    deps = Deps(store=make_store(), admin_token=os.environ.get("ADMIN_TOKEN", "dev-token"))

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            self._handle()

        def do_POST(self) -> None:
            self._handle()

        def _handle(self) -> None:
            url = urlsplit(self.path)
            headers = {k.lower(): v for k, v in self.headers.items()}
            headers["cloudfront-viewer-address"] = f"{self.client_address[0]}:0"
            res = handle_request(
                Request(self.command, url.path, dict(parse_qsl(url.query)), headers), deps
            )
            body = res.body.encode()
            self.send_response(res.status)
            for key, value in res.headers.items():
                self.send_header(key, value)
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    print(f"[api] listening on http://localhost:{port} (admin token: {deps.admin_token})")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
