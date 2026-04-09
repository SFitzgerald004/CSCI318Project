from extensions import db
from datetime import datetime, timezone

class Recommendation:
    COLLECTION = 'recommendations'

    @staticmethod
    def create(trip_id, category, source, name, external_id=None,
                description=None, address=None, price=None, price_level=None,
                rating=None, review_count=None, image_url=None,
                booking_url=None, is_ai_pick=False):
        doc = {
            'trip_id': trip_id,
            'category': category,       # 'hotel','restaurant','attraction','flight','car_rental'
            'source': source,           # 'yelp','amadeus','ai_generated'
            'external_id': external_id, # Yelp business ID or Amadeus offer ID
            'name': name,
            'description': description,
            'address': address,
            'price': price,
            'price_level': price_level, # '$' through '$$$$'
            'rating': rating,
            'review_count': review_count,
            'image_url': image_url,
            'booking_url': booking_url,
            'is_ai_pick': is_ai_pick,
            'created_at': datetime.now(timezone.utc)
        }
        ref = db.collection(Recommendation.COLLECTION).document()
        ref.set(doc)
        return {'id': ref.id, **doc}

    @staticmethod
    def get_by_trip(trip_id, category=None):
        query = db.collection(Recommendation.COLLECTION).where('trip_id', '==', trip_id)
        if category:
            query = query.where('category', '==', category)
        docs = query.stream()
        return [{'id': d.id, **d.to_dict()} for d in docs]

    @staticmethod
    def delete(rec_id):
        db.collection(Recommendation.COLLECTION).document(rec_id).delete()