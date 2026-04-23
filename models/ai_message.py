import extensions
from datetime import datetime, timezone


class AiMessage:
    COLLECTION = 'ai_messages'

    @staticmethod
    def save_pair(trip_id, action, user_content, ai_content, tools_used, category, can_save):
        now = datetime.now(timezone.utc)
        coll = extensions.db.collection(AiMessage.COLLECTION)

        user_ref = coll.document()
        user_payload = {
            'trip_id': trip_id,
            'role': 'user',
            'content': user_content,
            'action': action,
            'created_at': now,
        }
        user_ref.set(user_payload)

        ai_ref = coll.document()
        ai_payload = {
            'trip_id': trip_id,
            'role': 'ai',
            'content': ai_content,
            'action': action,
            'tools_used': tools_used or [],
            'category': category,
            'can_save': can_save,
            'created_at': now,
        }
        ai_ref.set(ai_payload)

        return (
            {'id': user_ref.id, **user_payload},
            {'id': ai_ref.id, **ai_payload},
        )

    @staticmethod
    def _fetch_all_for_trip(trip_id):
        """Fetch all ai_messages docs for a trip with a single-field query.

        Uses only a where('trip_id', ==, ...) filter so no composite Firestore
        index is required. Filtering/sorting happens in Python — fine for the
        expected scale (<50 messages/trip). Returns [] on any Firestore error.
        """
        try:
            query = extensions.db.collection(AiMessage.COLLECTION).where('trip_id', '==', trip_id)
            return [{'id': d.id, **d.to_dict()} for d in query.stream()]
        except Exception:
            return []

    @staticmethod
    def get_cached(trip_id, action):
        """Return the most recent AI message for this trip + action, or None."""
        docs = AiMessage._fetch_all_for_trip(trip_id)
        matches = [d for d in docs if d.get('action') == action and d.get('role') == 'ai']
        if not matches:
            return None
        matches.sort(key=lambda d: d.get('created_at') or datetime.min, reverse=True)
        return matches[0]

    @staticmethod
    def get_by_trip(trip_id):
        """Return all messages for a trip in chronological order.

        Secondary sort on role puts 'user' before 'ai' when timestamps are
        identical (save_pair writes both messages with the same `now`), so
        each conversation turn renders as user-prompt-then-ai-response.
        """
        docs = AiMessage._fetch_all_for_trip(trip_id)
        docs.sort(key=lambda d: (
            d.get('created_at') or datetime.min,
            0 if d.get('role') == 'user' else 1,
        ))
        results = []
        for data in docs:
            if isinstance(data.get('created_at'), datetime):
                data['created_at'] = data['created_at'].isoformat()
            results.append(data)
        return results
