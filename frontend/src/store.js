import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import api from "./api";

const useStore = create((set) => ({
  token: localStorage.getItem("authToken") || null,
  user: null,
  isAuthenticated: false,
  services: [],
  userServices: [],
  orders: [],
  sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
  conversations: [],
  unreadMessagesCount: 0,
  isLoading: false,
  bootstrapped: false,

  setBootstrapped: (value) => {
    console.log("setBootstrapped:", value);
    set({ bootstrapped: value });
  },

  setToken: (token, user, refreshToken) => {
    console.log("setToken called with:", {
      token: token?.substring(0, 10) + "...",
      user,
      refreshToken: refreshToken?.substring(0, 10) + "...",
    });
    localStorage.setItem("authToken", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    set({ token, user, isAuthenticated: !!token && !!user });
    console.log("Token, user, and isAuthenticated state updated:", {
      isAuthenticated: !!token && !!user,
    });
  },

  clear: () => {
    console.log("Clearing store state");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      services: [],
      userServices: [],
      orders: [],
      sellerOrders: { newOrders: [], orderHistory: [], newOrdersCount: 0 },
      conversations: [],
      unreadMessagesCount: 0,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  isTokenValid: async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No token provided for isTokenValid");
      set({ isAuthenticated: false });
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        console.log("Token expired, relying on api.js interceptor for refresh");
        set({ isAuthenticated: false });
        return false;
      }
      console.log("Token not expired, validating with server");
      const user = await useStore.getState().validateToken();
      const isValid = !!user;
      set({ isAuthenticated: isValid });
      console.log("isTokenValid result:", isValid);
      return isValid;
    } catch (error) {
      console.error("Token validation error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isAuthenticated: false });
      return false;
    }
  },

  validateToken: async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No token provided for validateToken");
      set({ isAuthenticated: false });
      return false;
    }
    try {
      console.log("Validating token with /auth/validate-token");
      const response = await api.get("/auth/validate-token");
      console.log("Validate token response:", response.data);
      if (response.data.valid) {
        set({ user: response.data.user, isAuthenticated: true });
        console.log("Token validated, user set:", response.data.user);
        return response.data.user;
      }
      console.log("Token validation failed: not valid");
      set({ isAuthenticated: false });
      return false;
    } catch (error) {
      console.error("Token validation failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        console.log("401 error, api.js interceptor should handle refresh");
        set({ isAuthenticated: false });
        return false;
      } else if (error.response?.status === 403) {
        console.log("403 error, treating as invalid token or permission issue");
        set({ isAuthenticated: false });
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return false;
      }
      console.log("Unexpected error during token validation");
      set({ isAuthenticated: false });
      return false;
    }
  },

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      console.log("Refreshing user profile");
      const response = await api.get("/api/profile");
      const updatedUser = response.data.user;

      set({
        user: updatedUser,
        isLoading: false,
        isAuthenticated: true,
      });

      console.log("User profile refreshed:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Refresh user error:", {
        message: error.message,
        status: error.response?.status,
      });

      // If unauthorized, clear auth state
      if (error.response?.status === 401) {
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        });
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      } else {
        set({ isLoading: false });
      }

      throw error;
    }
  },

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/services");
      set({ services: response.data.services, isLoading: false });
    } catch (error) {
      console.error("Fetch services error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUserServices: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/services/user");
      set({ userServices: response.data.services, isLoading: false });
    } catch (error) {
      console.error("Fetch user services error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isLoading: false });
      throw error;
    }
  },

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/orders?limit=5");
      set({ orders: response.data.orders, isLoading: false });
    } catch (error) {
      console.error("Fetch orders error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isLoading: false });
      throw error;
    }
  },

  fetchSellerOrders: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/seller-orders?limit=5");
      set({ sellerOrders: response.data, isLoading: false });
    } catch (error) {
      console.error("Fetch seller orders error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isLoading: false });
      throw error;
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/conversations?limit=5");
      const conversations = Array.isArray(response.data.conversations)
        ? response.data.conversations
        : [];
      const unreadMessagesCount = conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      set({
        conversations,
        unreadMessagesCount,
        isLoading: false,
      });
    } catch (error) {
      console.error("Fetch conversations error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ conversations: [], unreadMessagesCount: 0, isLoading: false });
      throw error;
    }
  },

  updateOrderStatusLocal: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
      sellerOrders: {
        ...state.sellerOrders,
        newOrders: state.sellerOrders.newOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        ),
        orderHistory: state.sellerOrders.orderHistory.map((order) =>
          order.id === orderId ? { ...order, status } : order
        ),
      },
    }));
  },

  updateOrderStatusApi: async (orderId, status) => {
    set({ isLoading: true });
    try {
      let endpoint;
      switch (status.toUpperCase()) {
        case "ACCEPTED":
          endpoint = `/api/orders/${orderId}/accept`;
          break;
        case "REJECTED":
          endpoint = `/api/orders/${orderId}/reject`;
          break;
        case "COMPLETED":
          endpoint = `/api/orders/${orderId}/complete`;
          break;
        case "CANCELLED":
          endpoint = `/api/orders/${orderId}/cancel`;
          break;
        default:
          throw new Error(`Unsupported order status: ${status}`);
      }
      console.log(
        `Updating order ${orderId} to status ${status} via ${endpoint}`
      );
      const response = await api.put(endpoint);
      console.log(`Order ${orderId} updated to ${status}:`, response.data);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        ),
        sellerOrders: {
          ...state.sellerOrders,
          newOrders: state.sellerOrders.newOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          orderHistory: state.sellerOrders.orderHistory.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
        },
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      console.error("Order update error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ isLoading: false });
      throw error;
    }
  },
  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      console.log("Updating profile with data:", formData);
      const response = await api.put("/api/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh user data after successful update
      await useStore.getState().refreshUser();

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error("Profile update error:", {
        message: error.message,
        status: error.response?.status,
      });
      set({ isLoading: false });
      throw error;
    }
  },
}));

export default useStore;
