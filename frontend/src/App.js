import React, { useEffect, useState } from "react";
import "./App.css";
import Login from "./components/Login/Login";
import Otp from "./components/Otp/Otp";
import HomePage from "./components/HomePage/HomePage";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Auth utility functions
const isLoggedIn = () => !!localStorage.getItem("userToken");
const isOtpVerified = () => localStorage.getItem("isOtpVerified") === "true";

// 🔐 AuthRoute with effect
function AuthRoute({ children }) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error("Please login first!");
      navigate("/login", { replace: true });
    } else {
      setAuthChecked(true);
    }
  }, [navigate]);

  return authChecked ? children : null;
}

// 🔐 FullProtectedRoute with effect
function FullProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error("Please login first!");
      navigate("/login", { replace: true });
    } else if (!isOtpVerified()) {
      toast.error("OTP verification required!");
      navigate("/otp", { replace: true });
    } else {
      setAuthChecked(true);
    }
  }, [navigate]);

  return authChecked ? children : null;
}

function App() {
  return (
    <>
      <ToastContainer position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<AuthRoute><Otp /></AuthRoute>} />
        <Route path="/home" element={<FullProtectedRoute><HomePage /></FullProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
