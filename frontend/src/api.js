// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // No /api prefix yet
});

// Automatic Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // Always authToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = res.data.accessToken;

        localStorage.setItem("authToken", newAccessToken); // always authToken
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
