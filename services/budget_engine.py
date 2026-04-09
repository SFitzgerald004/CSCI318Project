# budget_engine.py

HIGH_COST_COUNTRIES = ['Switzerland', 'Norway', 'Japan', 'Australia', 'United Kingdom', 'Denmark', 'Iceland']
LOW_COST_COUNTRIES = ['Mexico', 'Thailand', 'Vietnam', 'Indonesia', 'Colombia', 'Portugal', 'Hungary']

# Base weights for different types of trips
BASE_WEIGHTS = {
    'vacation': {'flights': 30, 'hotel': 25, 'food': 20, 'activities': 15, 'transport': 5, 'misc': 5},
    'business': {'flights': 40, 'hotel': 30, 'food': 15, 'activities': 5, 'transport': 7, 'misc': 3},
    'family': {'flights': 30, 'hotel': 30, 'food': 22, 'activities': 12, 'transport': 4, 'misc': 2},
    'adventure': {'flights': 28, 'hotel': 20, 'food': 15, 'activities': 27, 'transport': 7, 'misc': 3},
}

def apply_adjustments(weights, num_nights, destination_country, hotel_prefs, food_prefs, activity_prefs):
    w = weights.copy()

    # Trip Duration
    if num_nights <= 3:
        w['flights'] += 5
        w['hotel'] -= 3
        w['misc'] -= 2
    elif num_nights >= 10:
        w['flights'] -= 5
        w['hotel'] += 3
        w['food'] += 2

    # Region Cost
    if destination_country in HIGH_COST_COUNTRIES:
        w['flights'] -= 5
        w['hotel'] += 3
        w['food'] += 2
    elif destination_country in LOW_COST_COUNTRIES:
        w['hotel'] -= 5
        w['food'] -= 3
        w['activities'] += 5
        w['misc'] += 3

    # Hotel preferences
    if hotel_prefs == 'luxury':
        w['hotel'] += 8
        w['food'] -= 4
        w['misc'] -= 4
    elif hotel_prefs == 'budget':
        w['hotel'] -= 8
        w['activities'] += 5
        w['food'] += 3

    # Food preferences
    if 'fine_dining' in food_prefs:
        w['food'] += 5
        w['misc'] -=3
    if 'street_food' or 'budget_eats' in food_prefs:
        w['food'] -= 3
        w['activities'] += 3

    # Activity preferences
    if 'museums' or 'attractions' in activity_prefs:
        w['activities'] += 3
        w['misc'] -= 3
    if 'nightlife' in activity_prefs:
        w['activities'] += 4
        w['food'] -= 2
        w['misc'] -= 2
    if 'beaches' or 'hiking' in activity_prefs:
        w['activities'] += 2
        w['transport'] += 2
        w['hotel'] -= 4

    return w

# Weight normalizer
def normalize(weights):
    MIN_PCT = 3.0
    for k in weights:
        weights[k] = max(weights[k], MIN_PCT)
    total = sum(weights.values())
    return {k: round((v / total) * 100, 2) for k, v in weights.items()}

# Budget allocation
def allocate_budget(total_budget, trip_purpose, num_nights, destination_country, hotel_prefs = 'mid_range', food_prefs = None, activity_prefs = None):
    food_prefs = food_prefs or []
    activity_prefs = activity_prefs or []

    base = BASE_WEIGHTS.get(trip_purpose, BASE_WEIGHTS['vacation']).copy()
    adjusted = apply_adjustments(base, num_nights, destination_country, hotel_prefs, food_prefs, activity_prefs)

    pcts = normalize(adjusted)
    amounts = {k: round((v / 100) * total_budget, 2) for k, v in pcts.items()}

    return {'percentages': pcts, 'amounts': amounts}