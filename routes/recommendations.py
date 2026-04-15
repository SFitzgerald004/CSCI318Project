# recommendations.py
from flask import Blueprint, request, jsonify                                                                                                  
from models.trip import Trip
from models.recommendation import Recommendation
from routes.auth import require_auth

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

    rec = Recommendation.create(                                                                                                               
        trip_id=trip_id,
        category=data['category'],
        source=data['source'],
        name=data['name'],                                                                                                                     
        external_id=data.get('external_id'),
        description=data.get('description'),                                                                                                   
        address=data.get('address'),
        price=data.get('price'),
        price_level=data.get('price_level'),                                                                                                   
        rating=data.get('rating'),
        review_count=data.get('review_count'),                                                                                                 
        image_url=data.get('image_url'),
        booking_url=data.get('booking_url'),                                                                                                   
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