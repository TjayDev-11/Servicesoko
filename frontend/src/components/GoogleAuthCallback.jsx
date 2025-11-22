// src/components/GoogleAuthCallback.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStore from "../store";

function GoogleAuthCallback() {
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userId = params.get("userId");
    const name = params.get("name");
    const email = params.get("email");
    const role = params.get("role");
    const error = params.get("error");

    if (error) {
      console.error("Google Auth Error:", error);
      navigate("/login", {
        state: { error: "Google authentication failed. Please try again." },
      });
      return;
    }

    if (accessToken && refreshToken && userId) {
      const user = { id: userId, name, email, role };
      setToken(accessToken, user, refreshToken);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", {
        state: { error: "Invalid Google authentication response." },
      });
    }
  }, [navigate, setToken, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processing Google authentication...</p>
    </div>
  );
}

export default GoogleAuthCallback;