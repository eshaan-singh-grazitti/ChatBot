import React, { useState } from 'react';
import axios from 'axios';

const AnswerBox = ({ sender, text, sources = [] ,question = ''}) => {
    const isUser = sender === 'user';
    const [feedback, setFeedback] = useState(null);
    const [comment, setComment] = useState('');

    const handleFeedback = async (vote) => {
        const sessionId = sessionStorage.getItem('sessionId');
        const BASE_URL = import.meta.env.VITE_API_URL;

        try {
            await axios.post(`${BASE_URL}/feedback`, {
                session_id: sessionId,
                rating: vote,
                comment,
                question,
                answer: text,
                sources,
            });
            setFeedback(vote);
        }
        catch (err) {
            alert("Error sending feedback")
        }
    };

    return (
        <div className={`chat-message ${isUser ? 'user' : 'ai'}`}>
            <div className="bubble">
                <p>{text}</p>
                {!isUser && sources.length > 0 && (
                    <div className="sources">
                        <strong>Sources:</strong>
                        <ul>
                            {sources.map((src, index) => (
                                <li key={index}>{src}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {!isUser && !feedback && (
                    <div className='feedback-ui'>
                        <button onClick={() => handleFeedback('up')}>👍</button>
                        <button onClick={() => handleFeedback('down')}>👎</button>
                        <input
                            type='text'
                            placeholder='Optional Comment'
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                )}

                {feedback && <p>✅ Feedback submitted({feedback})</p>}
            </div>
        </div>
    );
};

export default AnswerBox;
