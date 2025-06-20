conversation_sessions = {}

def append_to_session(session_id: str, user_msg: str, ai_msg: str):
    if session_id not in conversation_sessions:
        conversation_sessions[session_id] = []
    conversation_sessions[session_id].append((user_msg.strip(), ai_msg.strip()))

def get_memory_context(session_id: str, limit: int = 4):
    history = conversation_sessions.get(session_id, [])
    return "\n".join([f"User: {u}\nAI: {a}" for u, a in history[-limit:]])
