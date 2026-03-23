from extensions import db
from datetime import datetime, timezone

class BudgetAllocation(db.Model):
    __tablename__ = 'budget_allocations'

    id      = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False, unique=True)

    flights_budget    = db.Column(db.Float, nullable=False)
    hotel_budget      = db.Column(db.Float, nullable=False)
    food_budget       = db.Column(db.Float, nullable=False)
    activities_budget = db.Column(db.Float, nullable=False)
    transport_budget  = db.Column(db.Float, nullable=False)
    misc_budget       = db.Column(db.Float, nullable=False)

    flights_pct    = db.Column(db.Float, nullable=False)
    hotel_pct      = db.Column(db.Float, nullable=False)
    food_pct       = db.Column(db.Float, nullable=False)
    activities_pct = db.Column(db.Float, nullable=False)
    transport_pct  = db.Column(db.Float, nullable=False)
    misc_pct       = db.Column(db.Float, nullable=False)

    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'trip_id': self.trip_id,
            'flights':    {'budget': self.flights_budget,    'pct': self.flights_pct},
            'hotel':      {'budget': self.hotel_budget,      'pct': self.hotel_pct},
            'food':       {'budget': self.food_budget,       'pct': self.food_pct},
            'activities': {'budget': self.activities_budget, 'pct': self.activities_pct},
            'transport':  {'budget': self.transport_budget,  'pct': self.transport_pct},
            'misc':       {'budget': self.misc_budget,       'pct': self.misc_pct},
        }