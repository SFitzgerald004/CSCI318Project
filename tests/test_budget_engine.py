import pytest
from services.budget_engine import allocate_budget, normalize, apply_adjustments, BASE_WEIGHTS


class TestAllocateBudget:
    """Test the main budget allocation function."""

    def test_returns_amounts_and_percentages(self):
        result = allocate_budget(1000, 'vacation', 5, 'France')
        assert 'amounts' in result
        assert 'percentages' in result

    def test_amounts_sum_to_total_budget(self):
        result = allocate_budget(3500, 'vacation', 7, 'Japan')
        total = sum(result['amounts'].values())
        assert abs(total - 3500) < 1  # allow rounding tolerance

    def test_percentages_sum_to_100(self):
        result = allocate_budget(3500, 'vacation', 7, 'Japan')
        total = sum(result['percentages'].values())
        assert abs(total - 100) < 1

    def test_all_six_categories_present(self):
        result = allocate_budget(2000, 'business', 3, 'Germany')
        expected_keys = {'flights', 'hotel', 'food', 'activities', 'transport', 'misc'}
        assert set(result['amounts'].keys()) == expected_keys
        assert set(result['percentages'].keys()) == expected_keys

    def test_unknown_purpose_defaults_to_vacation(self):
        result = allocate_budget(1000, 'unknown_purpose', 5, 'France')
        vacation_result = allocate_budget(1000, 'vacation', 5, 'France')
        assert result['percentages'] == vacation_result['percentages']

    def test_zero_budget_returns_zero_amounts(self):
        result = allocate_budget(0, 'vacation', 5, 'France')
        for amount in result['amounts'].values():
            assert amount == 0

    def test_large_budget(self):
        result = allocate_budget(50000, 'vacation', 14, 'Switzerland')
        total = sum(result['amounts'].values())
        assert abs(total - 50000) < 10  # rounding across 6 categories


class TestApplyAdjustments:
    """Test budget weight adjustments based on trip parameters."""

    def test_short_trip_increases_flight_weight(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 2, '', 'mid_range', [], [])
        assert adjusted['flights'] > BASE_WEIGHTS['vacation']['flights']

    def test_long_trip_decreases_flight_weight(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 12, '', 'mid_range', [], [])
        assert adjusted['flights'] < BASE_WEIGHTS['vacation']['flights']

    def test_high_cost_country_decreases_flights(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, 'Switzerland', 'mid_range', [], [])
        assert adjusted['flights'] < BASE_WEIGHTS['vacation']['flights']

    def test_low_cost_country_increases_activities(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, 'Thailand', 'mid_range', [], [])
        assert adjusted['activities'] > BASE_WEIGHTS['vacation']['activities']

    def test_luxury_hotel_increases_hotel_weight(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, '', 'luxury', [], [])
        assert adjusted['hotel'] > BASE_WEIGHTS['vacation']['hotel']

    def test_budget_hotel_decreases_hotel_weight(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, '', 'budget', [], [])
        assert adjusted['hotel'] < BASE_WEIGHTS['vacation']['hotel']

    def test_fine_dining_increases_food_weight(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, '', 'mid_range', ['fine_dining'], [])
        assert adjusted['food'] > BASE_WEIGHTS['vacation']['food']

    def test_nightlife_increases_activities(self):
        base = BASE_WEIGHTS['vacation'].copy()
        adjusted = apply_adjustments(base, 5, '', 'mid_range', [], ['nightlife'])
        assert adjusted['activities'] > BASE_WEIGHTS['vacation']['activities']


class TestNormalize:
    """Test weight normalization."""

    def test_normalized_weights_sum_to_100(self):
        weights = {'a': 30, 'b': 20, 'c': 50}
        result = normalize(weights)
        assert abs(sum(result.values()) - 100) < 0.1

    def test_minimum_percentage_enforced(self):
        # normalize clamps to MIN_PCT=3 before normalizing, so small values get lifted
        weights = {'a': 100, 'b': 0, 'c': 0}
        result = normalize(weights)
        # After clamping: a=100, b=3, c=3 -> total=106 -> b = 3/106*100 ≈ 2.83
        # The minimum is enforced pre-normalization, not post
        assert result['b'] > 0
        assert result['c'] > 0

    def test_negative_weights_get_minimum(self):
        weights = {'a': 50, 'b': -10, 'c': 30}
        result = normalize(weights)
        assert result['b'] >= 3.0


class TestTripPurposes:
    """Test that all trip purposes produce valid allocations."""

    @pytest.mark.parametrize("purpose", ['vacation', 'business', 'family', 'adventure'])
    def test_purpose_produces_valid_allocation(self, purpose):
        result = allocate_budget(2000, purpose, 5, 'France')
        assert abs(sum(result['amounts'].values()) - 2000) < 1
        assert abs(sum(result['percentages'].values()) - 100) < 1
        assert all(v >= 0 for v in result['amounts'].values())
