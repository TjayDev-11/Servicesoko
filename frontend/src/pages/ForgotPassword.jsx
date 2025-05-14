import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const sectionRef = useRef(null);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Email or phone number is required");
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccess("If an account exists, a reset link has been sent. Check your email or phone.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.message === "User not found"
          ? "No account found for this email or phone"
          : err.message === "Password reset requires email verification"
          ? "This account requires email verification for reset"
          : err.message.includes("Too many")
          ? "Too many requests. Please try again later."
          : err.message || "An unexpected error occurred"
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        ref={sectionRef}
        className="w-full max-w-md bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200 opacity-0 animate-fadeInUp"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-600">
            Enter your email or phone number to receive a reset link
          </p>
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

        <form onSubmit={handleForgotPassword}>
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

          <button
            type="submit"
            className="w-full py-3 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Remember your password?{" "}
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

export default ForgotPassword;