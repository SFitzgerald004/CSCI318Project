# recommendations.py
from flask import Blueprint, request, jsonify                                                                                                  
from models.trip import Trip
from models.recommendation import Recommendation
from routes.auth import require_auth
from services.google_places_service import enrich_recommendation

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/api/recommendations/<trip_id>', methods=['GET'])                                                                   
@require_auth
def get_recommendations(trip_id):                                                                                                              
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:                                                                                                         
        return jsonify({'error': 'Unauthorized'}), 403
                                                                                                                                                
    category = request.args.get('category')
    recs = Recommendation.get_by_trip(trip_id, category=category)
    return jsonify(recs), 200                                                                                                                  

@recommendations_bp.route('/api/recommendations/<trip_id>', methods=['POST'])                                                                  
@require_auth   
def create_recommendation(trip_id):
    trip = Trip.get(trip_id)                                                                                                                   
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404                                                                                       
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
                                                                                                                                                
    data = request.get_json()
    if not data.get('category') or not data.get('source') or not data.get('name'):                                                             
        return jsonify({'error': 'category, source, and name are required'}), 400    

    # Uses new enriching service function
    enriched = {}
    if data.get("source") == ("ai_generated"):
        enriched = enrich_recommendation(
            name=data["name"],
            category=data["category"],
            trip=trip
        )

    rec = Recommendation.create(                                                                                                               
        trip_id=trip_id,
        category=data['category'],
        source=data['source'],
        name=data['name'],                                                                                                                     
        external_id=enriched.get('external_id') or data.get('external_id'),
        description=data.get('description'),                                                                                                   
        address=enriched.get('address') or data.get('address'),
        price=data.get('price'),
        price_level=enriched.get('price_level') or data.get('price_level'),
        rating=enriched.get('rating') if enriched.get('rating') is not None else data.get('rating'),
        review_count=enriched.get('review_count') if enriched.get('review_count') is not None else data.get('review_count'),
        image_url=data.get('image_url'),
        booking_url=enriched.get('booking_url') or data.get('booking_url'),
        is_ai_pick=data.get('is_ai_pick', False)
    )                                                                                                                                          
    return jsonify(rec), 201
                                                                                                                                                
@recommendations_bp.route('/api/recommendations/<trip_id>/<rec_id>', methods=['DELETE'])
@require_auth                                                                                                                                  
def delete_recommendation(trip_id, rec_id):
    trip = Trip.get(trip_id)
    if not trip:                                                                                                                               
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:                                                                                                         
        return jsonify({'error': 'Unauthorized'}), 403

    Recommendation.delete(rec_id)                                                                                                              
    return jsonify({'message': 'Recommendation deleted'}), 200