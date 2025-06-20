import React, { useEffect, useState } from "react";
import '../styles/Links.css'
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BackBtn from "./BackBtn";



const AdminLinks = () => {

    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [sourceStats, setSourceStats] = useState(null)
    const BASE_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const handleLinkAdmin = () => {
        navigate("/admin")
    }
    const handleLinkStats = () => {
        navigate("/admin/stats")
    }
    const handleLinkSource = () => {
        navigate("/admin/sources")
    }

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
                const res = await axios.get(`${BASE_URL}/feedback-stats`);
                const res1 = await axios.get(`${BASE_URL}/source-stats`);
                setStats(res.data);
                setSourceStats(res1.data);
            } catch (err) {
                console.error("Error fetching stats", err);
            }
        };
        fetchStats();
    }, []);
    if (!stats) return <p>Loading dashboard...</p>;
    return (
        <>
            <div className="uni-div-card">
                <BackBtn />
                <div className="dashboard-container">
                    <div className="dashboard-header">
                        <h1 className="dashboard-title">Admin Panel</h1>
                        <p className="dashboard-subtitle">Manage your system with ease</p>
                    </div>

                    <div className="tiles-grid">
                        <div className="tile admin" onClick={handleLinkAdmin}>
                            <div className="tile-icon">⚙️</div>
                            <h2 className="tile-title">Admin</h2>
                            <p className="tile-description">Manage Feedbacks, approve and reject</p>
                            <div className="tile-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{stats.approved_feedbacks}</div>
                                    <div className="stat-label">Approved</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{stats.rejected_feedbacks}</div>
                                    <div className="stat-label">Rejected</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{stats.pending_feedbacks}</div>
                                    <div className="stat-label">Pending</div>
                                </div>
                            </div>
                        </div>

                        <div onClick={handleLinkStats} className="tile stats">
                            <div className="tile-icon">📊</div>
                            <h2 className="tile-title">Statistics</h2>
                            <p className="tile-description">View analytics, reports, and performance metrics</p>
                            <div className="tile-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{stats.positive_feedbacks}</div>
                                    <div className="stat-label">Positive</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{stats.negative_feedbacks}</div>
                                    <div className="stat-label">Negative</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{stats.positive_percentage}%</div>
                                    <div className="stat-label">Positivity</div>
                                </div>
                            </div>
                        </div>

                        <div onClick={handleLinkSource} className="tile sources1">
                            <div className="tile-icon">🗄️</div>
                            <h2 className="tile-title">Sources</h2>
                            <p className="tile-description">Data sources, one place for all sources</p>
                            <div className="tile-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{sourceStats.length}</div>
                                    <div className="stat-label">Sources</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AdminLinks