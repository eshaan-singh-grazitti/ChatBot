import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/admin.css";
import BackBtn from "./BackBtn";
import Navbar from "./Navbar";

const AdminSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
        const res = await axios.get(`${BASE_URL}/source-stats`);
        setSources(res.data);
      } catch (err) {
        console.error("Error fetching source stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p>Loading source feedback stats...</p>;

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <BackBtn />
        <h2>📚 Source Feedback Analytics</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Total</th>
              <th>👍</th>
              <th>👎</th>
              <th>Positivity %</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => (
              <tr key={i} className={s.score < 0 ? "bad-source" : ""}>
                <td>{s.source}</td>
                <td>{s.total}</td>
                <td>{s.positive}</td>
                <td>{s.negative}</td>
                <td>{s.positive_percent}%</td>
                <td>{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminSources;
