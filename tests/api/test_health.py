from fastapi.testclient import TestClient

from src.api.app import create_app


def test_health_endpoint_reports_ok(tmp_path):
    client = TestClient(create_app(str(tmp_path / "health.db")))
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
