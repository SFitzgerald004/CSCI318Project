# savings_plan.py
from extensions import db
from datetime import datetime, timezone

class SavingsPlan(db.Model):
    __tablename__ = 'savings_plans'

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False, unique=True)

    total_budget = db.Column(db.Float, nullable=False)
    amount_saved = db.Column(db.Float, default=0.0)
    amount_remaining = db.Column(db.Float, nullable=False)

    days_until_trip = db.Column(db.Integer, nullable=False)
    weeks_until_trip = db.Column(db.Integer, nullable=False)
    months_until_trip = db.Column(db.Float,   nullable=False)

    weekly_savings_needed = db.Column(db.Float, nullable=False)
    biweekly_savings_needed = db.Column(db.Float, nullable=False)
    monthly_savings_needed = db.Column(db.Float, nullable=False)

    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'trip_id': self.trip_id,
            'total_budget': self.total_budget,
            'amount_saved': self.amount_saved,
            'amount_remaining': self.amount_remaining,
            'days_until_trip': self.days_until_trip,
            'save_weekly':   self.weekly_savings_needed,
            'save_biweekly': self.biweekly_savings_needed,
            'save_monthly':  self.monthly_savings_needed,
        }