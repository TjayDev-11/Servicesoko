import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    // ... existing logic ...
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        padding: "20px",
      }}
    >
      <div
        style={{
          padding: "40px",
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          maxWidth: "450px",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#4fc3f7",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          Reset Password
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Enter your email to receive a password reset link
        </p>

        {message && (
          <div
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.2)",
              color: "#4caf50",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 83, 80, 0.2)",
              color: "#ef5350",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "8px",
              fontWeight: "500",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#2d2d2d",
              border: "1px solid #333",
              borderRadius: "6px",
              color: "white",
              fontSize: "16px",
              transition: "all 0.3s ease",
              ":focus": {
                outline: "none",
                borderColor: "#4fc3f7",
                boxShadow: "0 0 0 3px rgba(79, 195, 247, 0.2)",
              },
            }}
          />
        </div>

        <button
          onClick={handleForgotPassword}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "#4fc3f7",
            color: "#121212",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
            marginBottom: "24px",
            ":hover": {
              backgroundColor: "#3fb3e6",
            },
          }}
        >
          Send Reset Link
        </button>

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          Remember your password?{" "}
          <Link
            to="/login"
            style={{
              color: "#4fc3f7",
              fontWeight: "500",
              textDecoration: "none",
              ":hover": {
                textDecoration: "underline",
              },
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
