import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/admin.css';
import FeedbackCharts from "./FeedbackCharts";
import RefreshEmbeddings from "./refreshEmbeddings";
import BackBtn from "./BackBtn";
import Navbar from "./Navbar";

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/protected`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (err) {
                navigate("/login");
            }
        };
        fetchProtectedData();
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/feedback-stats`);
                setStats(response.data);
            }
            catch (error) {
                console.error("Error fetching feedback stats", error);
            }
            finally {
                setLoading(false);
            }
        };

        fetchStats();
    });


    if (loading) return <p>Loading stats...</p>
    return (
        <>
            <Navbar />
            <div className="admin-container">
                <div className="head-div">
                    <h2>Feedback analytics</h2>
                    <BackBtn />
                </div>
                <RefreshEmbeddings />
                <div className="export-section">
                    <h3>📤 Export Feedback</h3>
                    <a href={`${BASE_URL}/export-feedback?format=csv`} target="_blank" rel="noreferrer">
                        <button className="export-btn">⬇ Export CSV</button>
                    </a>
                    <a href={`${BASE_URL}/export-feedback?format=json`} target="_blank" rel="noreferrer">
                        <button className="export-btn">⬇ Export JSON</button>
                    </a>
                </div>
                <div className="list-section">
                    <h3>🧱 Problematic Chunks</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Flags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.problematic_chunks.map((chunk, i) => (
                                <tr key={i}>
                                    <td>{chunk.source}</td>
                                    <td>{chunk.flags}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


                <div className="stat-grid">
                    <div className="stat-card">
                        <h3>Total Feedbacks</h3>
                        <p>{stats.total_feedbacks}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Positives Feedbacks</h3>
                        <p>{stats.positive_feedbacks}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Negative Feedbacks</h3>
                        <p>{stats.negative_feedbacks}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Positive Feedbacks %</h3>
                        <p>{stats.positive_percentage}%</p>
                    </div>
                </div>
                {stats && <FeedbackCharts stats={stats} />}
                <div className="list-section">
                    <h3>Most Flagged Questions</h3>
                    <ul>
                        {stats.most_flagged_questions.map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ul>

                    <h3>Most Negetive Sources</h3>
                    <ul>
                        {stats.top_negative_sources.map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default AdminStats