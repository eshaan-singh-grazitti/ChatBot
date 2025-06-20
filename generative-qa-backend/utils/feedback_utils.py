from models import Feedback

def get_source_feedback_scores(session):
    feedbacks = session.query(Feedback).all()
    source_stats = {}

    for f in feedbacks:
        if not f.sources:
            continue
        for source in f.sources:
            if source not in source_stats:
                source_stats[source] = {"up": 0, "down": 0}
            if f.rating == "up":
                source_stats[source]["up"] += 1
            elif f.rating == "down":
                source_stats[source]["down"] += 1

    return source_stats
