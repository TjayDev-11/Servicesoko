// pages/GoogleCallback.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../store";

function GoogleCallback() {
  const { setToken } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [searchParams, setToken, navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>Redirecting...</div>
  );
}

export default GoogleCallback;
