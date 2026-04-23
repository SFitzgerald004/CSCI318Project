import json
from unittest.mock import patch
from services.ai_tools import _calculate_daily_spend, _get_saved_recommendations


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


class TestGetSavedRecommendations:
    @patch("services.ai_tools.Recommendation")
    def test_returns_json_list_of_recommendations(self, MockRec):
        MockRec.get_by_trip.return_value = [
            {"name": "Louvre", "category": "attraction", "price_level": "$$", "rating": 5, "description": "art"},
            {"name": "Le Meurice", "category": "hotel", "price_level": "$$$$", "rating": 4, "description": "lux hotel"},
        ]
        result = _get_saved_recommendations(trip_id="trip123")
        parsed = json.loads(result)
        assert len(parsed) == 2
        assert parsed[0]["name"] == "Louvre"
        MockRec.get_by_trip.assert_called_once_with("trip123", category=None)

    @patch("services.ai_tools.Recommendation")
    def test_category_filter_passed_through(self, MockRec):
        MockRec.get_by_trip.return_value = []
        _get_saved_recommendations(trip_id="trip123", category="hotel")
        MockRec.get_by_trip.assert_called_once_with("trip123", category="hotel")

    @patch("services.ai_tools.Recommendation")
    def test_empty_list_returns_empty_json_array(self, MockRec):
        MockRec.get_by_trip.return_value = []
        result = _get_saved_recommendations(trip_id="trip123")
        assert json.loads(result) == []

    @patch("services.ai_tools.Recommendation")
    def test_model_exception_returns_error_json_not_raises(self, MockRec):
        MockRec.get_by_trip.side_effect = RuntimeError("firestore down")
        result = _get_saved_recommendations(trip_id="trip123")
        parsed = json.loads(result)
        assert "error" in parsed
