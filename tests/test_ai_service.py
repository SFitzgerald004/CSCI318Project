from services.ai_service import _humanize_prefs, _build_system_prompt


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
