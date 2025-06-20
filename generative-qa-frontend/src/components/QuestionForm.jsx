import React, { useState } from 'react';
import axios from 'axios';

const QuestionForm = ({ onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/ask`, { question });
      const { answer, sources } = response.data;
      onSubmit(question, answer, sources);
    } catch (error) {
      onSubmit(question, '⚠️ Error fetching response.', []);
      console.error(error);
    } finally {
      setQuestion('');
      setLoading(false);
    }
  };

  return (
    <form className="input-box" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Ask something..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? '...' : 'Send'}
      </button>
    </form>
  );
};

export default QuestionForm;
