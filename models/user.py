# user.py
from extensions import db
from datetime import datetime, timezone

class User:
    COLLECTION = 'users'

    @staticmethod
    def create(uid, email, home_city=None, home_airport=None):
        # Create a new user document; UID comes from Firebase Auth
        doc = {
            'email': email,
            'home_city': home_city,
            'home_airport': home_airport,   # Will use the IATA code
            'created_at': datetime.now(timezone.utc)
        }
        db.collection(User.COLLECTION).document(uid).set(doc)
        return {'id': uid, **doc}
    
    @staticmethod
    def get(uid):
        doc = db.collection(User.COLLECTION).document(uid).get()
        if doc.exists:
            return {'id': doc.id, **doc.to_dict()}
        return None
    
    @staticmethod
    def update(uid, data):
        db.collection(User.COLLECTION).document(uid).update(data)

    @staticmethod
    def delete(uid):
        db.collection(User.COLLECTION).document(uid).delete()