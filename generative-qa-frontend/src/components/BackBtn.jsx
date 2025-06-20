import { useNavigate } from "react-router-dom";
import '../styles/App.css'

const BackBtn = () => {
    const navigate = useNavigate();

    const handleBackBtn = () => {
        localStorage.removeItem("token");
        navigate("/")
    }

    return (
        <button className="admin-btn" onClick={handleBackBtn}>⬅️ Back to Chat</button>
    )
}

export default BackBtn;