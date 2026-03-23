# user.py
from extensions import db
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String(120), unique = True, nullable = False)
    password_hash = db.Column(db.String(256), nullable = False)
    home_city = db.Column(db.String(100), nullable = True)
    home_airport = db.Column(db.String(10), nullable = True) # This is used because the Amadeus API uses IATA airport codes
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    trips = db.relationship('Trip', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'home_location': self.home_location,
            'created_at': self.created_at
        }