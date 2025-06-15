import "./App.css";
import Login from "./components/Login/Login";
import Otp from "./components/Otp/Otp";
import HomePage from "./components/HomePage/HomePage";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("userToken");
  
  
  
  if (!isAuthenticated) {
    toast.error("You need to login first!", { position: "top-center", autoClose: 2000 });
    return <Navigate to="/login" replace/>;
    
    
  }
  

  return children;
}

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<ProtectedRoute><Otp /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} /> {/* Redirect unknown routes */}
      </Routes>
    </>
  );
}

export default App;
