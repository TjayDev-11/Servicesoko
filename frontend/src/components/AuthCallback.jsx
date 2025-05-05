import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStore from "../store";

function AuthCallback() {
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const accessToken = query.get("accessToken");
    const refreshToken = query.get("refreshToken");
    const user = query.get("user")
      ? JSON.parse(decodeURIComponent(query.get("user")))
      : null;
    const error = query.get("error");

    if (error) {
      setError(error || "Google authentication failed. Please try again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (accessToken && refreshToken && user) {
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setToken(accessToken, user, refreshToken);
      setSuccess("Google login successful! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 2000);
    } else {
      setError(
        "Invalid response from Google authentication. Please try again."
      );
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [navigate, setToken, location.search]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          padding: "48px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {success && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}
        {error && (
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
        <p style={{ color: "#666", fontSize: "16px" }}>
          {success
            ? "Authenticating..."
            : error
            ? "Authentication failed"
            : "Processing Google authentication..."}
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;
