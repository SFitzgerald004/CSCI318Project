# savings_plan.py
from extensions import db
from datetime import datetime, timezone

class SavingsPlan:
    COLLECTION = 'savings_plans'

    @staticmethod
    def save(trip_id, total_budget, amount_saved, days_until_trip):
        amount_remaining = total_budget - amount_saved
        weeks = days_until_trip / 7
        months = days_until_trip / 30.44

        doc = {
            'trip_id': trip_id,
            'total_budget': total_budget,
            'amount_saved': amount_saved,
            'amount_remaining': amount_remaining,
            'days_until_trip': days_until_trip,
            'weeks_until_trip': int(weeks),
            'months_until_trip': round(months, 1),
            'weekly_savings_needed':   round(amount_remaining / weeks, 2)   if weeks > 0   else amount_remaining,
            'biweekly_savings_needed': round(amount_remaining / (weeks / 2), 2) if weeks > 0 else amount_remaining,
            'monthly_savings_needed':  round(amount_remaining / months, 2)  if months > 0  else amount_remaining,
            'generated_at': datetime.now(timezone.utc)
        }
        # Use trip_id as document ID so there's only ever one plan per trip
        db.collection(SavingsPlan.COLLECTION).document(trip_id).set(doc)
        return doc

    @staticmethod
    def get(trip_id):
        doc = db.collection(SavingsPlan.COLLECTION).document(trip_id).get()
        if doc.exists:
            return doc.to_dict()
        return None