import React, { useState } from "react";
import './style.css';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import NiftyLogo from './Nifty10-logo.png'

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
localStorage.setItem("activeTab", "dashboard");
    const handleSubmit = (e) => {
        e.preventDefault();
        // Corrected validation logic (AND condition)
        if (username === "admin" && password === "finpages") {
            setError("");
            toast.success("OTP Sent To Your Mobile!", { autoClose: 2000 });
            localStorage.setItem("userToken", "authenticated");
            setTimeout(() => navigate("/otp"), 2000);
            

        } else {
            setError("Invalid username or password!");
            toast.error("Invalid Credentials. Please try again.", { autoClose: 2000 });
        }
    };

    return (
        <div className="login-main-container">
            <ToastContainer position="top-center" />
            <div className="login-container">
                <div className="login-logo">
                    <img 
                        src={NiftyLogo}
                        alt="Logo" 
                    />
                    <h2 className="login-heading">LOGIN</h2>
                </div>
                
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-box">
                        <label htmlFor="username">Username:</label>
                        <div className="input-field">
                            <i className="fas fa-user"></i>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                placeholder="Enter Username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-box">
                        <label htmlFor="password">Password:</label>
                        <div className="input-field">
                            <i className="fas fa-lock"></i> 
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                placeholder="Enter Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn">LOGIN</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
