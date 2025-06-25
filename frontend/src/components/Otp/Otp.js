import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./style.css";
const Otp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Function to send OTP via API
const sendOtp = async () => {
  try {
    const mobileNo = localStorage.getItem("userMobile");
    const response = await axios.put("http://localhost:4000/user/send-otp", { mobileNo });
    const receivedOtp = response.data.otp;
    if (receivedOtp) {
      setGeneratedOtp(receivedOtp);
    }
  } catch (error) {
    toast.error("Failed to send OTP. Please try again.");
  }
};


  // Function to verify OTP via API
const verifyOtp = async () => {
  try {
    const mobileNo = localStorage.getItem("userMobile");
    const fullOtp = otp.join("");
    await axios.put("http://localhost:4000/user/verify-otp", { mobileNo, otp: fullOtp });

    toast.success("OTP Verified! Redirecting...");
    localStorage.setItem("isOtpVerfied", "true");
    console.log("OTP Verified:", localStorage.getItem("isOtpVerified"));
    setTimeout(() => navigate("/home"), 2000);
  } catch (error) {
    toast.error("Invalid OTP. Please try again.");
  }
};


  

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("userToken");
    if (!isAuthenticated) {
      toast.error("You need to login first!");
      navigate("/login");
      return;
    }
    sendOtp();
  }, [navigate]);

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
          <p className="otp-hint">Hint OTP: {generatedOtp}</p>
          <button className="verify-btn" type="submit">Verify OTP</button>
        </form>
        <p className="resend">
          Haven't received the OTP?{" "}
          <a
            href="/otp"
            onClick={(e) => {
              e.preventDefault();
              sendOtp();
              setOtp(["", "", "", "", "", ""]);
              inputRefs.current[0]?.focus();
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