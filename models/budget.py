from extensions import db
from datetime import datetime, timezone

class BudgetAllocation:
    COLLECTION = 'budget_allocations'

    @staticmethod
    def save(trip_id, amounts, percentages):
        doc = {
            'trip_id': trip_id,
            'flights_budget':    amounts['flights'],
            'hotel_budget':      amounts['hotel'],
            'food_budget':       amounts['food'],
            'activities_budget': amounts['activities'],
            'transport_budget':  amounts['transport'],
            'misc_budget':       amounts['misc'],
            'flights_pct':    percentages['flights'],
            'hotel_pct':      percentages['hotel'],
            'food_pct':       percentages['food'],
            'activities_pct': percentages['activities'],
            'transport_pct':  percentages['transport'],
            'misc_pct':       percentages['misc'],
            'generated_at': datetime.now(timezone.utc)
        }
        # Use trip_id as document ID so there's only ever one allocation per trip
        db.collection(BudgetAllocation.COLLECTION).document(trip_id).set(doc)
        return doc

    @staticmethod
    def get(trip_id):
        doc = db.collection(BudgetAllocation.COLLECTION).document(trip_id).get()
        if doc.exists:
            return doc.to_dict()
        return None