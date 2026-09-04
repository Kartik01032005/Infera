import unittest
from backend.app.main import read_root, health_check
from backend.app.api.v1.health import get_health


class TestHealthEndpoints(unittest.TestCase):
    def test_read_root(self):
        result = read_root()
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["app"], "Infera API")
        self.assertEqual(result["version"], "0.1.0")

    def test_health_check(self):
        result = health_check()
        self.assertEqual(result["status"], "ok")

    def test_v1_health(self):
        result = get_health()
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["data"]["status"], "healthy")


if __name__ == "__main__":
    unittest.main()
