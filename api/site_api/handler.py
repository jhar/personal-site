"""Lambda entry point (function URL, payload format 2.0)."""

import os
from typing import Any

from .app import Deps, Request, handle_request
from .store import DynamoVisitStore

_deps = Deps(
    store=DynamoVisitStore(os.environ["VISITS_TABLE"]),
    admin_token=os.environ.get("ADMIN_TOKEN"),
)


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    res = handle_request(
        Request(
            method=event["requestContext"]["http"]["method"],
            path=event["rawPath"],
            query=event.get("queryStringParameters") or {},
            headers=event.get("headers") or {},
        ),
        _deps,
    )
    return {"statusCode": res.status, "headers": res.headers, "body": res.body}
