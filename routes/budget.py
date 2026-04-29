# budget.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from models.savings_plan import SavingsPlan
from services.budget_engine import allocate_budget
from routes.auth import require_auth
from datetime import date

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/api/budget/<trip_id>/allocate', methods=['POST'])
@require_auth
def create_allocation(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    
    departure = trip['departure_date']
    return_date = trip['return_date']

    # Frirestore returns dates as datetime objects
    if hasattr(departure, 'date'):
        departure = departure.date()
    if hasattr(return_date, 'date'):
        return_date = return_date.date()

    num_nights = (return_date - departure).days

    result = allocate_budget(
        total_budget=trip['total_budget'],
        trip_purpose=trip['trip_purpose'],
        num_nights=num_nights,
        destination_country=trip.get('destination_country', ''),
        hotel_prefs=trip.get('hotel_prefs', 'mid_range'),
        food_prefs=trip.get('food_prefs', []),
        activity_prefs=trip.get('activity_prefs', [])
    )

    allocation = BudgetAllocation.save(trip_id, result['amounts'], result['percentages'])
    return jsonify(allocation), 200

@budget_bp.route('/api/budget/<trip_id>/allocate', methods=["GET"])
@require_auth
def get_allocation(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({'error': 'No allocation found, POST to generate one'}), 404
    return jsonify(allocation), 200


CATEGORY_KEYS = ('flights', 'hotel', 'food', 'activities', 'transport', 'misc')


@budget_bp.route('/api/budget/<trip_id>/allocate', methods=['PUT'])
@require_auth
def update_allocation(trip_id):
    """Manual allocation override.

    Body: {"amounts": {"flights": 1200, "hotel": 1500, ...}}
    Percentages are recomputed from amounts so the two never drift.
    """
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403

    body = request.get_json(silent=True) or {}
    raw_amounts = body.get('amounts')
    if not isinstance(raw_amounts, dict):
        return jsonify({'error': 'amounts must be an object keyed by category'}), 400

    # Coerce + sanity-check every category. Missing keys default to 0.
    try:
        amounts = {
            k: max(0, int(round(float(raw_amounts.get(k, 0)))))
            for k in CATEGORY_KEYS
        }
    except (TypeError, ValueError):
        return jsonify({'error': 'amounts must be numbers'}), 400

    total = sum(amounts.values())
    target = int(trip['total_budget'])

    # Allow $1 of rounding slack; otherwise reject so the user can correct.
    if abs(total - target) > 1:
        return jsonify({
            'error': f'Sum of amounts (${total}) must equal total budget (${target})',
            'sum': total,
            'target': target,
        }), 400

    # Recompute percentages from amounts; absorb any rounding error into
    # the largest category so the percentages always sum to exactly 100.
    if total > 0:
        raw_pcts = {k: round((v / total) * 100) for k, v in amounts.items()}
        diff = 100 - sum(raw_pcts.values())
        if diff != 0:
            biggest = max(amounts, key=amounts.get)
            raw_pcts[biggest] += diff
        percentages = raw_pcts
    else:
        percentages = {k: 0 for k in CATEGORY_KEYS}

    allocation = BudgetAllocation.save(trip_id, amounts, percentages)
    return jsonify(allocation), 200

@budget_bp.route('/api/budget/<trip_id>/savings', methods=['POST'])                                                           
@require_auth   
def create_savings_plan(trip_id):
    trip = Trip.get(trip_id)                                                                                                  
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404                                                                      
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403                                                                        
   
    amount_saved = request.get_json().get('amount_saved', 0)                                                                  
                  
    departure = trip['departure_date']                                                                                        
    if hasattr(departure, 'date'):
        departure = departure.date()

    days_until_trip = (departure - date.today()).days                                                                         
    if days_until_trip <= 0:
        return jsonify({'error': 'Trip departure date has already passed'}), 400                                              
                                                                                                                                
    plan = SavingsPlan.save(trip_id, trip['total_budget'], amount_saved, days_until_trip)
    return jsonify(plan), 200                                                                                                 
                                                                                                                                
@budget_bp.route('/api/budget/<trip_id>/savings', methods=['GET'])
@require_auth                                                                                                                 
def get_savings_plan(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404                                                                      
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403                                                                        
                  
    plan = SavingsPlan.get(trip_id)                                                                                           
    if not plan:
        return jsonify({'error': 'No savings plan found, POST to generate one'}), 404                                         
    return jsonify(plan), 200