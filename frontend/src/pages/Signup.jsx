import { useState, useEffect, useRef } from "react";
import useStore from "../store";
import { useNavigate, Link, useLocation} from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Signup() {
  const { setToken } = useStore();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "buyer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const getPasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: "Weak", color: "bg-red-500" };
    if (password.length > 5) score += 1;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 20, label: "Weak", color: "bg-red-500" };
    if (score === 2)
      return { score: 40, label: "Fair", color: "bg-orange-500" };
    if (score === 3)
      return { score: 60, label: "Good", color: "bg-yellow-500" };
    if (score === 4)
      return { score: 80, label: "Strong", color: "bg-green-500" };
    return { score: 100, label: "Very Strong", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(form.password);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.identifier.trim() || !form.password.trim()) {
      setError("All fields are required");
      setTimeout(() => setError(""), 3000);
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,}$/;
    if (
      !emailRegex.test(form.identifier) &&
      !phoneRegex.test(form.identifier)
    ) {
      setError("Please enter a valid email or phone number");
      setTimeout(() => setError(""), 3000);
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setTimeout(() => setError(""), 3000);
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 60) {
      setError(
        "Password is too weak. Use at least 8 characters with uppercase, numbers, and special characters."
      );
      setTimeout(() => setError(""), 3000);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          password: form.password.trim(),
          email: form.identifier.includes("@") ? form.identifier.trim() : null,
          phone: !form.identifier.includes("@") ? form.identifier.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setToken(data.token);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
            Create Your Account
          </h2>
          <p className="text-sm text-gray-600">
            Join thousands of satisfied users
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center gap-2 animate-fadeInUp animation-delay-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20]">
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

        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-all"
              disabled={loading}
              aria-label="Full name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter your email or phone"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
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
              <span className="text-sm text-gray-600">
                {passwordStrength.label}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                style={{ width: `${passwordStrength.score}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-all"
                disabled={loading}
                aria-label="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                disabled={loading}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
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
          {loading ? "Authenticating..." : "Sign up with Google"}
        </button>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-cyan-400 font-medium hover:text-cyan-500 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;