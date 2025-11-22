import { useState, useEffect, useRef } from "react";
import useStore from "../store";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const { setToken } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const sectionRef = useRef(null);

  useEffect(() => {
    // Check for error from Google Auth redirect
    if (location.state?.error) {
      setError(location.state.error);
      setTimeout(() => setError(""), 3000);
    }
  }, [location.state]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Email or phone and password are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,}$/;
    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      setError("Please enter a valid email or phone number");
      setTimeout(() => setError(""), 3000);
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
          rememberMe,
        }),
      });

      const data = await res.json();
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
      setSuccess("Login successful! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err) {
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
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-5 py-12 px-4 sm:px-6 lg:px-8">
      <div
        ref={sectionRef}
        className="w-full max-w-md bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200 opacity-0 animate-fadeInUp"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-600">Log in to access your account</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center gap-2 animate-fadeInUp animation-delay-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm flex items-center gap-2 animate-fadeInUp animation-delay-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter your email or phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-all"
              disabled={loading}
              aria-label="Email or phone number"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-700 font-medium text-sm">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-cyan-400 hover:text-cyan-500 text-sm transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-all"
                disabled={loading}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-cyan-400 focus:ring-cyan-400 disabled:opacity-50"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-600">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-white border border-gray-300 rounded-md text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          disabled={loading}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            className="w-5 h-5"
          />
          {loading ? "Authenticating..." : "Continue with Google"}
        </button>

        <p className="text-center mt-6 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-cyan-400 font-medium hover:text-cyan-500 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;