import React, { useState } from "react";
import axios from "axios";

const RefreshEmbeddings = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleRefresh = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await axios.get(`${BASE_URL}/refresh-docs`);
      setStatus(res.data.status || "Refresh complete");
    } catch (err) {
      console.error("Error refreshing embeddings:", err);
      setStatus("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refresh-section">
      <h3>🔄 Refresh Embeddings</h3>
      <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Now"}
      </button>
      {status && <p className="refresh-status">{status}</p>}
    </div>
  );
};

export default RefreshEmbeddings;
