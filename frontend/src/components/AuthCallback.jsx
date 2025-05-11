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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        {success && (
          <div
            className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm"
            role="alert"
            aria-live="polite"
          >
            {success}
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        <p className="text-gray-600 text-base">
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
