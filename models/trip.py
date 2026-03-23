# trip.py
from extensions import db
from datetime import datetime, timezone

class Trip(db.Model):
    __tablename__ = 'trips'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    destination = db.Column(db.String(200), nullable=False)
    destination_country = db.Column(db.String(100), nullable=True)                                                                 
    total_budget = db.Column(db.Float, nullable=False)                                                                      
    departure_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date, nullable=False)                                                                       
    trip_purpose = db.Column(db.String(50), nullable=False)
    num_travelers = db.Column(db.Integer, default=1)                                                                         
                  
    food_prefs = db.Column(db.String(300), nullable=True)                                                                 
    activity_prefs = db.Column(db.String(300), nullable=True)
    hotel_prefs = db.Column(db.String(50), nullable=True)                                                                  
                                                                                                                                      
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))                                                   
  
    budget_allocation = db.relationship('BudgetAllocation', backref='trip', uselist=False, cascade='all, delete-orphan')            
    savings_plan = db.relationship('SavingsPlan', backref='trip', uselist=False, cascade='all, delete-orphan')
    recommendations = db.relationship('Recommendation', backref='trip', lazy=True, cascade='all, delete-orphan')                  
                                                                                                                                      
    @property                                                                                                                       
    def num_nights(self):                                                                                                           
        return (self.return_date - self.departure_date).days

    def to_dict(self):                                                                                                              
        return {
            'id': self.id,                                                                                                          
            'user_id': self.user_id,                                                                                              
            'destination': self.destination,
            'destination_country': self.destination_country,
            'total_budget': self.total_budget,
            'departure_date': self.departure_date.isoformat(),
            'return_date': self.return_date.isoformat(),                                                                            
            'num_nights': self.num_nights,
            'trip_purpose': self.trip_purpose,                                                                                      
            'num_travelers': self.num_travelers,                                                                                  
            'food_prefs': self.food_prefs,                                                                                          
            'activity_prefs': self.activity_prefs,
            'hotel_prefs': self.hotel_prefs,                                                                                        
        }