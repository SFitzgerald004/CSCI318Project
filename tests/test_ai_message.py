import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone


@pytest.fixture
def mock_db():
    with patch('extensions.db') as db:
        yield db


class TestSavePair:
    def test_save_pair_writes_two_documents(self, mock_db):
        from models.ai_message import AiMessage
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        user_ref = MagicMock(); user_ref.id = 'user_doc_id'
        ai_ref = MagicMock(); ai_ref.id = 'ai_doc_id'
        mock_collection.document.side_effect = [user_ref, ai_ref]

        user_doc, ai_doc = AiMessage.save_pair(
            trip_id='trip1', action='recommend:hotels',
            user_content='Get hotels recommendations',
            ai_content='Here are 3 hotels...',
            tools_used=['get_saved_recommendations'],
            category='hotel', can_save=True,
        )
        assert mock_collection.document.call_count == 2
        assert user_ref.set.called
        assert ai_ref.set.called
        user_payload = user_ref.set.call_args.args[0]
        assert user_payload['trip_id'] == 'trip1'
        assert user_payload['role'] == 'user'
        assert user_payload['content'] == 'Get hotels recommendations'
        assert user_payload['action'] == 'recommend:hotels'
        assert 'created_at' in user_payload
        ai_payload = ai_ref.set.call_args.args[0]
        assert ai_payload['role'] == 'ai'
        assert ai_payload['content'] == 'Here are 3 hotels...'
        assert ai_payload['tools_used'] == ['get_saved_recommendations']
        assert ai_payload['category'] == 'hotel'
        assert ai_payload['can_save'] is True


class TestGetCached:
    def test_get_cached_returns_most_recent_ai_message_for_action(self, mock_db):
        from models.ai_message import AiMessage
        doc1 = MagicMock(); doc1.id = 'ai_1'
        doc1.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'ai', 'content': 'advice',
            'action': 'analyze', 'tools_used': [], 'category': None, 'can_save': False,
            'created_at': datetime(2026, 4, 22, tzinfo=timezone.utc),
        }
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.limit.return_value = query
        query.stream.return_value = iter([doc1])
        mock_db.collection.return_value = query
        result = AiMessage.get_cached(trip_id='trip1', action='analyze')
        assert result is not None
        assert result['id'] == 'ai_1'
        assert result['content'] == 'advice'

    def test_get_cached_returns_none_when_no_match(self, mock_db):
        from models.ai_message import AiMessage
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.limit.return_value = query
        query.stream.return_value = iter([])
        mock_db.collection.return_value = query
        result = AiMessage.get_cached(trip_id='trip1', action='analyze')
        assert result is None


class TestGetByTrip:
    def test_get_by_trip_returns_messages_in_order(self, mock_db):
        from models.ai_message import AiMessage
        doc1 = MagicMock(); doc1.id = 'm1'
        doc1.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'user', 'content': 'hi',
            'action': 'analyze', 'created_at': datetime(2026, 4, 22, 10, 0, tzinfo=timezone.utc),
        }
        doc2 = MagicMock(); doc2.id = 'm2'
        doc2.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'ai', 'content': 'advice',
            'action': 'analyze', 'created_at': datetime(2026, 4, 22, 10, 0, 5, tzinfo=timezone.utc),
        }
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.stream.return_value = iter([doc1, doc2])
        mock_db.collection.return_value = query
        result = AiMessage.get_by_trip('trip1')
        assert len(result) == 2
        assert result[0]['id'] == 'm1'
        assert result[1]['id'] == 'm2'
        assert isinstance(result[0]['created_at'], str)
