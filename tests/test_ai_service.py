from datetime import date, datetime
from services.ai_service import _humanize_prefs, _build_system_prompt, _build_analyze_prompt, _build_recommend_prompt, _normalize_dates_and_count_nights


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

    def test_has_correct_per_day_calculation(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        # 7 nights, $3000 total → $428.57/day
        assert "$428.57/day" in prompt

    def test_treats_preferences_as_constraints(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "firm constraints" in prompt


class TestBuildRecommendPrompt:
    def _trip(self):
        return {
            "destination": "Tokyo, Japan",
            "trip_purpose": "vacation",
            "num_travelers": 1,
            "total_budget": 2500,
            "departure_date": date(2026, 9, 1),
            "return_date": date(2026, 9, 8),
            "food_prefs": ["street_food"],
            "activity_prefs": ["museums", "nightlife"],
            "hotel_prefs": "budget",
        }

    def _allocation(self):
        return {
            "flights_budget": 900, "flights_pct": 36,
            "hotel_budget": 700, "hotel_pct": 28,
            "food_budget": 400, "food_pct": 16,
            "activities_budget": 300, "activities_pct": 12,
            "transport_budget": 150, "transport_pct": 6,
            "misc_budget": 50, "misc_pct": 2,
        }

    def test_hotels_focus_uses_hotel_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="hotels")
        assert "$700" in prompt
        assert "hotels" in prompt

    def test_food_focus_uses_food_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="food")
        assert "$400" in prompt
        assert "food" in prompt

    def test_activities_focus_uses_activities_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="activities")
        assert "$300" in prompt

    def test_prompt_nudges_saved_recommendations_tool(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="hotels")
        assert "get_saved_recommendations" in prompt

    def test_preferences_are_humanized(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="food")
        assert "street_food" in prompt
        assert "museums, nightlife" in prompt


class TestNormalizeDates:
    def test_with_date_objects(self):
        trip = {"departure_date": date(2026, 7, 1), "return_date": date(2026, 7, 8)}
        assert _normalize_dates_and_count_nights(trip) == 7

    def test_with_datetime_objects(self):
        trip = {
            "departure_date": datetime(2026, 7, 1, 12, 0),
            "return_date": datetime(2026, 7, 8, 12, 0),
        }
        # datetime objects have .date() attribute, should be normalized
        assert _normalize_dates_and_count_nights(trip) == 7


from types import SimpleNamespace
from unittest.mock import patch


def _fake_message(content=None, tool_calls=None):
    """Build a fake OpenAI ChatCompletionMessage-like object."""
    return SimpleNamespace(content=content, tool_calls=tool_calls or [])


def _fake_response(message):
    return SimpleNamespace(choices=[SimpleNamespace(message=message)])


class TestRunWithToolsNoToolCalls:
    @patch("services.ai_service.client")
    def test_returns_content_and_empty_tools_used(self, mock_client):
        mock_client.chat.completions.create.return_value = _fake_response(
            _fake_message(content="Here is my advice.", tool_calls=[])
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content == "Here is my advice."
        assert tools_used == []
        assert error is None
        mock_client.chat.completions.create.assert_called_once()


def _fake_tool_call(call_id, name, arguments_json):
    return SimpleNamespace(
        id=call_id,
        function=SimpleNamespace(name=name, arguments=arguments_json),
    )


class TestRunWithToolsSingleCall:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_dispatches_tool_then_returns_final_content(self, mock_client, mock_registry):
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"daily_amount": 100}'

        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("call_1", "calculate_daily_spend", '{"total_amount": 700, "num_days": 7}')
            ])),
            _fake_response(_fake_message(content="Your daily spend is $100.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{"type": "function", "function": {"name": "calculate_daily_spend"}}],
        )
        assert content == "Your daily spend is $100."
        assert tools_used == ["calculate_daily_spend"]
        assert error is None
        assert mock_client.chat.completions.create.call_count == 2


class TestRunWithToolsParallelCalls:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_multiple_tools_one_iteration_all_dispatched(self, mock_client, mock_registry):
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"ok": true}'

        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("a", "get_saved_recommendations", '{"trip_id": "t1"}'),
                _fake_tool_call("b", "get_savings_progress", '{"trip_id": "t1"}'),
            ])),
            _fake_response(_fake_message(content="Done.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert tools_used == ["get_saved_recommendations", "get_savings_progress"]
        assert content == "Done."
        assert mock_client.chat.completions.create.call_count == 2


class TestRunWithToolsErrorRecovery:
    @patch("services.ai_service.client")
    def test_unknown_tool_appends_error_and_continues(self, mock_client):
        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("x", "nonexistent_tool", "{}")
            ])),
            _fake_response(_fake_message(content="Recovered.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert content == "Recovered."
        assert tools_used == ["nonexistent_tool"]
        assert error is None

    @patch("services.ai_service.client")
    def test_bad_json_arguments_appends_error_and_continues(self, mock_client):
        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("x", "calculate_daily_spend", "{not valid json")
            ])),
            _fake_response(_fake_message(content="Recovered.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert content == "Recovered."
        assert tools_used == ["calculate_daily_spend"]
        assert error is None


import openai
from unittest.mock import MagicMock


class TestRunWithToolsLimits:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_max_iterations_exceeded_returns_error(self, mock_client, mock_registry):
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"ok": true}'

        mock_client.chat.completions.create.return_value = _fake_response(
            _fake_message(tool_calls=[_fake_tool_call("x", "calculate_daily_spend", "{}")])
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
            max_iterations=3,
        )
        assert content is None
        assert "3 tool-call iterations" in error
        # The contract is that the API was called exactly max_iterations times,
        # regardless of how many tool calls each response carried.
        assert mock_client.chat.completions.create.call_count == 3
        assert len(tools_used) > 0  # sanity: the loop did attempt dispatch

    @patch("services.ai_service.client")
    def test_api_connection_error_returns_error_tuple(self, mock_client):
        mock_client.chat.completions.create.side_effect = openai.APIConnectionError(request=MagicMock())
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content is None
        assert tools_used == []
        assert "Could not reach AI service" in error

    @patch("services.ai_service.client")
    def test_rate_limit_returns_error_tuple(self, mock_client):
        fake_response = MagicMock()
        fake_response.status_code = 429
        # MagicMock (not SimpleNamespace) because openai.RateLimitError's __init__
        # reads response.headers and response.request during error construction.
        mock_client.chat.completions.create.side_effect = openai.RateLimitError(
            message="rate limit", response=fake_response, body=None
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content is None
        assert "rate limit" in error.lower()


class TestAnalyzeBudgetReturnShape:
    @patch("services.ai_service._run_with_tools")
    def test_returns_three_tuple_with_tools_used(self, mock_run):
        mock_run.return_value = ("some advice", ["get_savings_progress"], None)

        from services.ai_service import analyze_budget
        trip = {
            "destination": "Paris, France",
            "trip_purpose": "vacation",
            "num_travelers": 2,
            "total_budget": 3000,
            "departure_date": date(2026, 7, 1),
            "return_date": date(2026, 7, 8),
            "food_prefs": ["fine_dining"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "mid_range",
        }
        allocation = {
            "flights_budget": 900, "flights_pct": 30,
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }

        content, tools_used, error = analyze_budget(trip, allocation)
        assert content == "some advice"
        assert tools_used == ["get_savings_progress"]
        assert error is None
        mock_run.assert_called_once()


class TestGetRecommendationsReturnShape:
    @patch("services.ai_service._run_with_tools")
    def test_returns_three_tuple_with_tools_used(self, mock_run):
        mock_run.return_value = ("3 options", ["get_saved_recommendations"], None)

        from services.ai_service import get_recommendations
        trip = {
            "destination": "Tokyo, Japan",
            "trip_purpose": "vacation",
            "num_travelers": 1,
            "total_budget": 2500,
            "departure_date": date(2026, 9, 1),
            "return_date": date(2026, 9, 8),
            "food_prefs": ["street_food"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "budget",
        }
        allocation = {
            "flights_budget": 900, "flights_pct": 36,
            "hotel_budget": 700, "hotel_pct": 28,
            "food_budget": 400, "food_pct": 16,
            "activities_budget": 300, "activities_pct": 12,
            "transport_budget": 150, "transport_pct": 6,
            "misc_budget": 50, "misc_pct": 2,
        }

        content, tools_used, error = get_recommendations(trip, allocation, focus="hotels")
        assert content == "3 options"
        assert tools_used == ["get_saved_recommendations"]
        assert error is None
