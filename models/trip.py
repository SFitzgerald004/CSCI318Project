# trip.py
from extensions import db
from datetime import datetime, timezone, time

class Trip:
    COLLECTION = 'trips'

    @staticmethod
    def create(user_id, destination, destination_country, total_budget,
            departure_date, return_date, trip_purpose, num_travelers=1,
            food_prefs=None, activity_prefs=None, hotel_prefs=None):
        doc = {
            'user_id': user_id,
            'destination': destination,
            'destination_country': destination_country,
            'total_budget': total_budget,
            'departure_date': datetime.combine(departure_date, time(0, 0), tzinfo=timezone.utc),
            'return_date': datetime.combine(return_date, time(0, 0), tzinfo=timezone.utc),
            'trip_purpose': trip_purpose,
            'num_travelers': num_travelers,
            'food_prefs': food_prefs or [],                 # list e.g. ['fine_dining', 'street_food']
            'activity_prefs': activity_prefs or [],         # list e.g. ['museums', 'nightlife']
            'hotel_prefs': hotel_prefs or 'mid_range',
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        ref = db.collection(Trip.COLLECTION).document()
        ref.set(doc)
        return {'id': ref.id, **doc}

    @staticmethod
    def get(trip_id):
        doc = db.collection(Trip.COLLECTION).document(trip_id).get()
        if doc.exists:
            return {'id': doc.id, **doc.to_dict()}
        return None

    @staticmethod
    def get_by_user(user_id):
        docs = db.collection(Trip.COLLECTION).where('user_id', '==', user_id).stream()
        return [{'id': d.id, **d.to_dict()} for d in docs]

    @staticmethod
    def update(trip_id, data):
        data['updated_at'] = datetime.now(timezone.utc)
        db.collection(Trip.COLLECTION).document(trip_id).update(data)

    @staticmethod
    def delete(trip_id):
        db.collection(Trip.COLLECTION).document(trip_id).delete()

    # New Itinerary Methods
    @staticmethod
    def get_itinerary(trip_id):
        trip = Trip.get(trip_id)
        if not trip:
            return None
        return trip.get('itinerary', [])
    
    @staticmethod
    def update_itinerary(trip_id, itinerary):
        Trip.update(trip_id, {'itinerary': itinerary})