from models import Feedback

def get_session_history(session, session_id: str, limit: int = 3):
    """
    Get the last N (Q&A) pairs for a given session_id
    """
    feedbacks = (
        session.query(Feedback)
        .filter(Feedback.session_id == session_id)
        .order_by(Feedback.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(feedbacks))
