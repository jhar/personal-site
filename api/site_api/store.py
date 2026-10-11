"""Visit storage. All visits share one DynamoDB partition sorted by timestamp.

At personal-site traffic that stays far below DynamoDB's per-partition limits,
and one Query returns the newest visits in order. Items never expire.
"""

from typing import Any, Protocol

Visit = dict[str, str]

PARTITION = "VISIT"
FIELDS = ("ip", "country", "region", "city", "path", "referrer", "userAgent", "ts")


class VisitStore(Protocol):
    def add(self, visit: Visit, visit_id: str) -> None: ...

    def recent(self, limit: int) -> list[Visit]:
        """Newest first."""
        ...


class DynamoVisitStore:
    def __init__(self, table_name: str, endpoint_url: str | None = None):
        import boto3

        self.table = boto3.resource("dynamodb", endpoint_url=endpoint_url).Table(table_name)

    def add(self, visit: Visit, visit_id: str) -> None:
        self.table.put_item(Item=_to_item(visit, visit_id))

    def add_many(self, visits: list[tuple[Visit, str]]) -> None:
        """Used by the one-off import of visits from Deno KV."""
        with self.table.batch_writer(overwrite_by_pkeys=["pk", "sk"]) as batch:
            for visit, visit_id in visits:
                batch.put_item(Item=_to_item(visit, visit_id))

    def recent(self, limit: int) -> list[Visit]:
        visits: list[Visit] = []
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": "pk = :pk",
            "ExpressionAttributeValues": {":pk": PARTITION},
            "ScanIndexForward": False,
        }
        while len(visits) < limit:
            res = self.table.query(Limit=limit - len(visits), **kwargs)
            visits.extend(_from_item(item) for item in res.get("Items", []))
            if "LastEvaluatedKey" not in res:
                break
            kwargs["ExclusiveStartKey"] = res["LastEvaluatedKey"]
        return visits


class MemoryVisitStore:
    def __init__(self) -> None:
        self.visits: list[Visit] = []

    def add(self, visit: Visit, visit_id: str) -> None:
        self.visits.append(visit)

    def recent(self, limit: int) -> list[Visit]:
        return sorted(self.visits, key=lambda v: v["ts"], reverse=True)[:limit]


def _to_item(visit: Visit, visit_id: str) -> dict[str, str]:
    return {"pk": PARTITION, "sk": f"{visit['ts']}#{visit_id}", **visit}


def _from_item(item: dict[str, Any]) -> Visit:
    return {field: str(item.get(field, "")) for field in FIELDS}
