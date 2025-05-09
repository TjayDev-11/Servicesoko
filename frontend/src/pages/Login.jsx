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
      console.log(
        "Sending login request to:",
        `${import.meta.env.VITE_API_URL}/auth/login`
      );
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
          rememberMe,
        }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

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

      await setToken(data.accessToken, data.user, data.refreshToken);
      console.log("setToken completed, setting success state");
      setSuccess("Login successful! Redirecting to dashboard...");

      // Fallback navigation in case useEffect doesn't trigger
      setTimeout(() => {
        console.log("Fallback navigation to dashboard");
        navigate("/dashboard", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message === "User not found!"
          ? "Email or phone not registered, please sign up"
          : err.message === "Wrong password!"
          ? "Incorrect password, please try again"
          : err.message === "This account uses social login"
          ? "This account uses Google login, please use Google to sign in"
          : err.message.includes("Too many")
          ? "Too many login attempts. Please try again in a few minutes."
          : err.message || "An unexpected error occurred, please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      console.log("Success state triggered, navigating to dashboard");
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    console.log("Initiating Google login");
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "5vw",
    },
    card: {
      padding: "clamp(24px, 8vw, 48px)",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      maxWidth: "480px",
      width: "100%",
    },
    title: {
      fontSize: "clamp(20px, 6vw, 28px)",
      fontWeight: "700",
      color: "#1a237e",
      marginBottom: "8px",
    },
    subtitle: {
      color: "#666",
      fontSize: "clamp(12px, 3vw, 16px)",
    },
    error: {
      backgroundColor: "#ffebee",
      color: "#c62828",
      padding: "1.2vw 1.6vw",
      borderRadius: "8px",
      marginBottom: "2vw",
      fontSize: "clamp(12px, 2.5vw, 14px)",
    },
    success: {
      backgroundColor: "#e8f5e9",
      color: "#2e7d32",
      padding: "1.2vw 1.6vw",
      borderRadius: "8px",
      marginBottom: "2vw",
      fontSize: "clamp(12px, 2.5vw, 14px)",
    },
    input: {
      width: "100%",
      padding: "clamp(10px, 3vw, 14px) 16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "clamp(12px, 3vw, 16px)",
      transition: "border-color 0.3s ease",
    },
    button: {
      width: "100%",
      padding: "clamp(12px, 3vw, 16px)",
      backgroundColor: "#1a237e",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "clamp(12px, 3vw, 16px)",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginBottom: "2vw",
    },
    googleButton: {
      width: "100%",
      padding: "clamp(10px, 3vw, 14px)",
      backgroundColor: "white",
      color: "#444",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "clamp(12px, 3vw, 15px)",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      transition: "all 0.3s ease",
    },
    "@media (max-width: 600px)": {
      card: {
        padding: "6vw",
      },
      input: {
        padding: "3vw 4vw",
      },
      button: {
        padding: "3vw",
      },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Log in to access your account</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
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
            style={styles.input}
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
            style={styles.input}
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
            ...styles.button,
            backgroundColor: loading ? "#cccccc" : "#1a237e",
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
          style={styles.googleButton}
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
