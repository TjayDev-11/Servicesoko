import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const { setToken } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load stored credentials on mount
  useEffect(() => {
    const storedCredentials = localStorage.getItem("loginCredentials");
    if (storedCredentials) {
      try {
        const { identifier, password } = JSON.parse(atob(storedCredentials));
        setIdentifier(identifier);
        setPassword(password);
        setRememberMe(true);
      } catch (err) {
        console.error("Failed to load stored credentials:", err);
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Email or phone and password are required");
      return;
    }
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Unexpected server response");
      }

      if (!res.ok) {
        throw new Error(
          data.error || "An unexpected error occurred during login"
        );
      }

      // Store credentials if "Remember Me" is checked
      if (rememberMe) {
        const credentials = {
          identifier: identifier.trim(),
          password: password.trim(),
        };
        localStorage.setItem(
          "loginCredentials",
          btoa(JSON.stringify(credentials))
        );
      } else {
        localStorage.removeItem("loginCredentials");
      }

      localStorage.setItem("authToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      await setToken(data.accessToken, data.user, data.refreshToken);
      setSuccess("Login successful! Redirecting to dashboard...");
    } catch (err) {
      console.error("Login error:", err);
      if (err.message === "User not found!") {
        setError("Email or phone not registered, please sign up");
      } else if (err.message === "Wrong password!") {
        setError("Incorrect password, please try again");
      } else if (err.message === "This account uses social login") {
        setError(
          "This account uses Google login, please use Google to sign in"
        );
      } else if (err.message.includes("Too many")) {
        setError("Too many login attempts. Please try again in a few minutes.");
      } else {
        setError(
          err.message || "An unexpected error occurred, please try again"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

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
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a237e",
              marginBottom: "8px",
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#666", fontSize: "16px" }}>
            Log in to access your account
          </p>
        </div>

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

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#444",
            }}
          >
            Email or Phone Number
          </label>
          <input
            type="text"
            placeholder="Enter your email or phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "border-color 0.3s ease",
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label style={{ fontWeight: "500", color: "#444" }}>Password</label>
            <Link
              to="/forgot-password"
              style={{
                color: "#4fc3f7",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              transition: "border-color 0.3s ease",
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: "8px" }}
              disabled={loading}
            />
            <span style={{ color: "#444", fontSize: "14px" }}>Remember Me</span>
          </label>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: loading ? "#cccccc" : "#1a237e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "20px",
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }}
          ></div>
          <span style={{ padding: "0 16px", color: "#777", fontSize: "14px" }}>
            OR
          </span>
          <div
            style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }}
          ></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "white",
            color: "#444",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.3s ease",
          }}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            style={{ width: "20px", height: "20px" }}
          />
          {loading ? "Authenticating..." : "Continue with Google"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#666",
            fontSize: "15px",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/signup"
            style={{
              color: "#4fc3f7",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
