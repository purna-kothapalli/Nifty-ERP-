import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";

const Otp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const DEFAULT_OTP = "841941";

  // Skip API; just check if user is authenticated and send dummy OTP
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("userToken");
    if (!isAuthenticated) {
      toast.error("You need to login first!");
      navigate("/login");
    }
  }, [navigate]);

  const verifyOtp = () => {
    const fullOtp = otp.join("");

    if (fullOtp !== DEFAULT_OTP) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    toast.success("OTP Verified! Redirecting...");
    localStorage.setItem("isOtpVerfied", "true");
    setTimeout(() => navigate("/home"), 2000);
  };

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="otp-main-container">
      <ToastContainer position="top-center" />
      <div className="otp-container">
        <h2>OTP has been sent to your registered mobile</h2>
        <p className="otp-sub-heading">Enter OTP</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtp();
          }}
        >
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
              />
            ))}
          </div>
          {/* <p className="otp-hint">Hint OTP: {DEFAULT_OTP}</p> */}
          <button className="verify-btn" type="submit">Verify OTP</button>
        </form>
        <p className="resend">
          Haven't received the OTP?{" "}
          <a
            href="/otp"
            onClick={(e) => {
              e.preventDefault();
              setOtp(["", "", "", "", "", ""]);
              inputRefs.current[0]?.focus();
              toast.info("OTP resent.");
            }}
          >
            RESEND
          </a>
        </p>
      </div>
    </div>
  );
};

export default Otp;
