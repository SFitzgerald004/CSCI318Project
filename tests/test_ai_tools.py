import json
from services.ai_tools import _calculate_daily_spend


class TestCalculateDailySpend:
    def test_happy_path_returns_json_string_with_rounded_daily(self):
        result = _calculate_daily_spend(total_amount=700, num_days=7)
        parsed = json.loads(result)
        assert parsed == {"daily_amount": 100.0}

    def test_rounds_to_two_decimals(self):
        result = _calculate_daily_spend(total_amount=1000, num_days=3)
        parsed = json.loads(result)
        assert parsed == {"daily_amount": 333.33}

    def test_zero_days_returns_error_json_not_raise(self):
        result = _calculate_daily_spend(total_amount=500, num_days=0)
        parsed = json.loads(result)
        assert "error" in parsed
        assert "positive" in parsed["error"]

    def test_negative_days_returns_error(self):
        result = _calculate_daily_spend(total_amount=500, num_days=-3)
        parsed = json.loads(result)
        assert "error" in parsed
