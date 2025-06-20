import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import "../styles/login.css"

const Login = ({ setToken }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_API_URL;

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${BASE_URL}/login`, {
                email,
                password,
            }, {
                headers: {
                    'Cache-Control': 'no-cache',
                }
            });
            console.log("response done",response);
            localStorage.setItem("token", response.data.access_token);
            setToken(response.data.access_token)
            console.log("navigating");
            navigate("/links")
            console.log("navigating done");
        }
        catch (err) {
            alert("Login failed");
            console.log(err)
        }
    };

    return (
        <>
            <div className="form-container">
                <form className="form">
                    <span className="heading">Login</span>
                    <div className="form-group">
                        <input className="form-input" required type="email" onChange={(e) => setEmail(e.target.value)} />
                        <label>Email</label>
                    </div>
                    <div className="form-group">
                        <input className="form-input" required type="password" onChange={(e) => setPassword(e.target.value)} />
                        <label>Password</label>
                    </div>
                    <button type="submit" onClick={handleLogin}>LOGIN</button>
                </form>
            </div>
        </>
    )
}

export default Login