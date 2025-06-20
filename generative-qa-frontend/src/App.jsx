import './styles/App.css'
import React, { useState, useRef, useEffect } from 'react';
import QuestionForm from './components/QuestionForm';
import AnswerBox from './components/AnswerBox';
import { useNavigate } from 'react-router-dom';


const App = () => {
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const existingSession = sessionStorage.getItem('sessionId');
    if (!existingSession) {
      const newId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', newId);
    }
  }, []);

  const addMessage = (question, answer, sources) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: question },
      { sender: 'ai', text: answer, sources, question },
    ]);
  };


  const handleAdminClick = () => {
    navigate('/login')
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <button className='admin-btn' onClick={handleAdminClick}>🔐 Admin Links</button>
      <div className="app-container">
        <h1>Generative Knowledge Hub</h1>
        <div className="chat-container" ref={chatRef}>
          {messages.map((msg, idx) => (
            <AnswerBox key={idx} sender={msg.sender} text={msg.text} sources={msg.sources} question={msg.question} />
          ))}
        </div>
        <QuestionForm onSubmit={addMessage} />
      </div>
    </>
  );
};

export default App;
