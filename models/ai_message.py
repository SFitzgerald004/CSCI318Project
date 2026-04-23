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
    def get_cached(trip_id, action):
        """Return the most recent AI message for this trip + action, or None.

        Returns None on any Firestore error (treats as cache miss). This keeps
        the AI endpoints working even when the required composite index has
        not been created yet (first-time production deploy) or Firestore is
        temporarily unavailable.
        """
        try:
            query = (
                extensions.db.collection(AiMessage.COLLECTION)
                .where('trip_id', '==', trip_id)
                .where('action', '==', action)
                .where('role', '==', 'ai')
                .order_by('created_at', direction='DESCENDING')
                .limit(1)
            )
            docs = list(query.stream())
        except Exception:
            return None
        if not docs:
            return None
        doc = docs[0]
        return {'id': doc.id, **doc.to_dict()}

    @staticmethod
    def get_by_trip(trip_id):
        """Return all messages for a trip in chronological order.

        Returns [] on any Firestore error so that a missing composite index or
        transient outage manifests as an empty chat history rather than a 500
        on the /messages endpoint.
        """
        try:
            query = (
                extensions.db.collection(AiMessage.COLLECTION)
                .where('trip_id', '==', trip_id)
                .order_by('created_at')
            )
            results = []
            for doc in query.stream():
                data = doc.to_dict()
                if isinstance(data.get('created_at'), datetime):
                    data['created_at'] = data['created_at'].isoformat()
                results.append({'id': doc.id, **data})
            return results
        except Exception:
            return []
