import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import api from "./api";

// Cache token validation for 30 seconds
let lastTokenValidation = 0;
let cachedTokenValidation = null;

export const validateToken = async (token) => {
  const now = Date.now();
  if (cachedTokenValidation && now - lastTokenValidation < 30000) {
    return cachedTokenValidation;
  }

  try {
    const response = await api.get("/auth/validate-token", {
      headers: { Authorization: `Bearer ${token}` },
    });
    cachedTokenValidation = response.data.valid ? response.data.user : false;
    lastTokenValidation = now;
    return cachedTokenValidation;
  } catch (error) {
    console.error("Token validation failed:", error.message);
    return false;
  }
};

const useStore = create((set, get) => ({
  token: localStorage.getItem("authToken") || null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  services: [],
  userServices: [],
  orders: [],
  sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
  conversations: [],
  reviews: [],
  currentServiceReviews: [],
  newOrdersCount: 0,
  unreadMessagesCount: 0,
  bootstrapped: false,

  setLoading: (loading) => set({ isLoading: loading }),
  setBootstrapped: (value) => set({ bootstrapped: value }),
  setError: (error) => set({ error }),

  isTokenValid: async (token) => {
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return false;

        const response = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("authToken", newAccessToken);
        set({ token: newAccessToken });
        return true;
      }
      return true;
    } catch (error) {
      console.error("Token validation error:", error.message);
      return false;
    }
  },

  setToken: async (token, userData = null, refreshToken = null) => {
    if (!token) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("loginCredentials");
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
        services: [],
        userServices: [],
        orders: [],
        sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
        conversations: [],
        reviews: [],
        currentServiceReviews: [],
        newOrdersCount: 0,
        unreadMessagesCount: 0,
        bootstrapped: true,
      });
      return;
    }

    localStorage.setItem("authToken", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    set({
      token,
      isAuthenticated: true,
      user: userData || null,
      error: null,
    });

    if (!userData) {
      await get().refreshUser(token);
    }
    set({ bootstrapped: true });
  },

  clear: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loginCredentials");
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      services: [],
      userServices: [],
      orders: [],
      sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
      conversations: [],
      reviews: [],
      currentServiceReviews: [],
      newOrdersCount: 0,
      unreadMessagesCount: 0,
      bootstrapped: true,
    });
  },

  refreshUser: async (token) => {
    if (!token) return;

    set({ isLoading: true });
    try {
      const response = await api.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        user: {
          ...response.data.user,
          isSeller: ["seller", "both"].includes(
            response.data.user.role?.toLowerCase()
          ),
          profileComplete: response.data.user.profileComplete,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      if (["seller", "both"].includes(response.data.user.role?.toLowerCase())) {
        await get().fetchUserServices(token);
        await get().fetchSellerOrders(token); // Fetch seller orders on user refresh
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Failed to refresh user",
      });
    }
  },

  fetchServices: async (token) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ services: response.data.services || [], isLoading: false });
    } catch (error) {
      set({ services: [], isLoading: false });
    }
  },

  fetchUserServices: async (token) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/services/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ userServices: response.data.services || [], isLoading: false });
    } catch (error) {
      set({ userServices: [], isLoading: false });
    }
  },

  addService: async (token, serviceData) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/api/services", serviceData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        userServices: [...state.userServices, response.data.service],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Failed to add service");
    }
  },

  fetchOrders: async (token) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/orders?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter to only include buyer orders
      const buyerOrders = response.data.orders.filter(
        (order) => order.role === "BUYER"
      );
      set({ orders: buyerOrders || [], isLoading: false });
    } catch (error) {
      console.error("Fetch orders error:", error);
      set({ orders: [], isLoading: false });
    }
  },

  fetchSellerOrders: async (token) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/seller-orders?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        sellerOrders: {
          newOrders: response.data.newOrders || [],
          orderHistory: response.data.orderHistory || [],
          newOrdersCount: response.data.newOrdersCount || 0,
        },
        newOrdersCount: response.data.newOrdersCount || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Fetch seller orders error:", error);
      set({
        sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
        newOrdersCount: 0,
        isLoading: false,
      });
    }
  },

  updateOrderStatus: (orderId, newStatus) => {
    set((state) => {
      const updatedNewOrders = state.sellerOrders.newOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      const newOrdersCount = updatedNewOrders.filter(
        (order) => order.status === "PENDING"
      ).length;
      return {
        sellerOrders: {
          ...state.sellerOrders,
          newOrders: updatedNewOrders,
          newOrdersCount,
        },
        newOrdersCount,
      };
    });
  },

  fetchConversations: async (token) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/conversations?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unreadMessagesCount = (response.data.conversations || []).reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      set({
        conversations: response.data.conversations || [],
        unreadMessagesCount,
        isLoading: false,
      });
    } catch (error) {
      set({ conversations: [], unreadMessagesCount: 0, isLoading: false });
    }
  },
}));

export default useStore;
