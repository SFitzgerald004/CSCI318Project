from datetime import date
from services.ai_service import _humanize_prefs, _build_system_prompt, _build_analyze_prompt


class TestHumanizePrefs:
    def test_joins_list_with_commas(self):
        assert _humanize_prefs(["fine_dining", "street_food"]) == "fine_dining, street_food"

    def test_empty_list_returns_placeholder(self):
        assert _humanize_prefs([]) == "no specific preference"

    def test_none_returns_placeholder(self):
        assert _humanize_prefs(None) == "no specific preference"

    def test_single_item_list(self):
        assert _humanize_prefs(["museums"]) == "museums"


class TestBuildSystemPrompt:
    def test_mentions_all_three_tools(self):
        prompt = _build_system_prompt()
        assert "get_saved_recommendations" in prompt
        assert "get_savings_progress" in prompt
        assert "calculate_daily_spend" in prompt

    def test_includes_preference_guardrail(self):
        prompt = _build_system_prompt()
        assert "do not override" in prompt.lower()

    def test_discourages_unnecessary_tool_calls(self):
        prompt = _build_system_prompt()
        assert "do NOT call tools just to show" in prompt


class TestBuildAnalyzePrompt:
    def _trip(self):
        return {
            "destination": "Paris, France",
            "trip_purpose": "vacation",
            "num_travelers": 2,
            "total_budget": 3000,
            "departure_date": date(2026, 7, 1),
            "return_date": date(2026, 7, 8),
            "food_prefs": ["fine_dining", "street_food"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "mid_range",
        }

    def _allocation(self):
        return {
            "flights_budget": 900, "flights_pct": 30,
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }

    def test_contains_destination_and_budget(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "Paris, France" in prompt
        assert "$3000" in prompt

    def test_preferences_are_human_readable_not_python_list(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "fine_dining, street_food" in prompt
        assert "['fine_dining'" not in prompt

    def test_has_per_day_figure(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "/day" in prompt

    def test_treats_preferences_as_constraints(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "firm constraints" in prompt
