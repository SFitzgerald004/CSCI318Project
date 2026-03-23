from extensions import db
from datetime import datetime, timezone

class Recommendation(db.Model):
    __tablename__ = 'recommendations'

    id          = db.Column(db.Integer, primary_key=True)
    trip_id     = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False)

    category    = db.Column(db.String(50),  nullable=False)  # 'hotel','restaurant','attraction','flight','car_rental'
    source      = db.Column(db.String(50),  nullable=False)  # 'yelp','amadeus','ai_generated'
    external_id = db.Column(db.String(200), nullable=True)   # Yelp/Amadeus ID

    name        = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text,        nullable=True)
    address     = db.Column(db.String(400), nullable=True)
    price       = db.Column(db.Float,       nullable=True)
    price_level = db.Column(db.String(20),  nullable=True)   # '$' through '$$$$'
    rating      = db.Column(db.Float,       nullable=True)
    review_count= db.Column(db.Integer,     nullable=True)
    image_url   = db.Column(db.String(500), nullable=True)
    booking_url = db.Column(db.String(500), nullable=True)
    is_ai_pick  = db.Column(db.Boolean,     default=False)

    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id,
            'category': self.category,
            'source': self.source,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'price': self.price,
            'price_level': self.price_level,
            'rating': self.rating,
            'review_count': self.review_count,
            'image_url': self.image_url,
            'booking_url': self.booking_url,
            'is_ai_pick': self.is_ai_pick,
        }