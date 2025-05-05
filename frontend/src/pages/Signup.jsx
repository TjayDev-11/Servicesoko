import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const { setToken } = useStore();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    name: "",
    role: "buyer",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: "Weak" };
    if (password.length > 5) score += 1;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 20, label: "Weak" };
    if (score === 2) return { score: 40, label: "Fair" };
    if (score === 3) return { score: 60, label: "Good" };
    if (score === 4) return { score: 80, label: "Strong" };
    return { score: 100, label: "Very Strong" };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleSignup = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          password: form.password,
          email: form.identifier.includes("@") ? form.identifier : null,
          phone: !form.identifier.includes("@") ? form.identifier : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setToken(data.token);
      setSuccess("Account created successfully! Redirecting to login...");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    window.location.href = "http://localhost:5000/auth/google";
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
            Create Your Account
          </h2>
          <p style={{ color: "#666", fontSize: "16px" }}>
            Join thousands of satisfied users
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
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
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

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#444",
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label style={{ fontWeight: "500", color: "#444" }}>Password</label>
            <span style={{ color: "#666", fontSize: "14px" }}>
              {passwordStrength.label}
            </span>
          </div>
          <input
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <div
            style={{
              width: "100%",
              height: "6px",
              backgroundColor: "#eee",
              borderRadius: "3px",
              marginTop: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${passwordStrength.score}%`,
                height: "100%",
                backgroundColor:
                  passwordStrength.score <= 40
                    ? "#ef5350"
                    : passwordStrength.score <= 60
                    ? "#ffa726"
                    : "#66bb6a",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
        </div>

        <button
          onClick={handleSignup}
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
          {loading ? "Creating Account..." : "Create Account"}
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
          {loading ? "Authenticating..." : "Sign up with Google"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#666",
            fontSize: "15px",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#4fc3f7",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
