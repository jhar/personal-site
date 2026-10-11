import importlib


def test_lambda_event_is_routed(monkeypatch):
    monkeypatch.setenv("VISITS_TABLE", "t")
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    handler = importlib.import_module("site_api.handler")

    from site_api.store import MemoryVisitStore

    monkeypatch.setattr(handler._deps, "store", MemoryVisitStore())
    res = handler.handler(
        {
            "rawPath": "/api/admin/visits",
            "headers": {"x-admin-token": "secret"},
            "requestContext": {"http": {"method": "GET"}},
        },
        None,
    )
    assert res == {
        "statusCode": 200,
        "headers": {"content-type": "application/json", "cache-control": "no-store"},
        "body": "[]",
    }
