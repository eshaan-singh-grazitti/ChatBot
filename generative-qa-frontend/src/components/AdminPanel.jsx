import React, { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/admin.css'
import BackBtn from "./BackBtn";
import Navbar from "./Navbar";

const AdminPanel = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const BASE_URL = import.meta.env.VITE_API_URL;

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/feedbacks`);
            setFeedbacks(response.data);
            console.log("Received feedbacks:", response.data);
        }
        catch (error) {
            console.error("Error fetching feedbacks", error);
        }
        finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        if (!id) {
            console.error("❌ Feedback ID is missing!");
            return;
        }
        try {
            await axios.patch(`${BASE_URL}/feedback/${id}?status=${status}`);
            // Refresh feedback list
            fetchFeedbacks(); // Or useState logic to re-fetch
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };


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
        fetchFeedbacks();
    }, []);



    return (
        <>
            <Navbar />
            <div className="admin-container">
                <div className="heading-div">
                    <h2>Admin Feedback Dashboard</h2>
                    <div className="btn-div">
                        <button className="refresh-btn" onClick={fetchFeedbacks}>Refresh</button>
                        <BackBtn />
                    </div>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Question</th>
                                <th>Answer</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Sources</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map((fb, index) => (
                                <tr key={index}>
                                    <td>{fb.session_id}</td>
                                    <td>{fb.question}</td>
                                    <td>{fb.answer}</td>
                                    <td className="rating-cell">
                                        {fb.rating === 'up' ? '⬆️ - UP' : fb.rating === 'down' ? '⬇️ - DOWN' : '—'}
                                    </td>
                                    <td>{fb.comment || "No comment"}</td>
                                    <td>
                                        <ul>
                                            {fb.sources?.map((src, i) => (
                                                <li key={i}>{src}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>{new Date(fb.timestamp).toLocaleString()}</td>

                                    <td className={`status-cell ${fb.approved}`}>
                                        {fb.approved}
                                    </td>
                                    <td className="btn-cell">
                                        {fb.approved === "pending" && (
                                            <>
                                                <button className="status-btn approve" onClick={() => updateStatus(fb.id, 'approved')}>✅</button>
                                                <button className="status-btn reject" onClick={() => updateStatus(fb.id, 'rejected')}>❌</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default AdminPanel