import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const cache = {
  services: { data: null, timestamp: null, ttl: 5 * 60 * 1000 },
  userServices: { data: null, timestamp: null, ttl: 5 * 60 * 1000 },
  profile: { data: null, timestamp: null, ttl: 2 * 60 * 1000 },
};
let lastRefreshTime = 0;
let isRefreshing = false;

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
  servicesLoading: false,
  userServicesLoading: false,
  ordersLoading: false,
  sellerOrdersLoading: false,
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
    cache.services = { data: null, timestamp: null, ttl: cache.services.ttl };
    cache.userServices = { data: null, timestamp: null, ttl: cache.userServices.ttl };
    cache.profile = { data: null, timestamp: null, ttl: cache.profile.ttl };
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

  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }
    try {
      console.log("Attempting to refresh token");
      const response = await api.post("/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      const user = await useStore.getState().validateToken(accessToken);
      if (user) {
        useStore
          .getState()
          .setToken(accessToken, user, newRefreshToken || refreshToken);
        console.log("Token refreshed successfully");
        return true;
      }
      console.log("Token refresh failed: no user data");
      return false;
    } catch (error) {
      console.error("Token refresh error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return false;
    }
  },

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
        console.log("Token expired, attempting to refresh");
        const refreshed = await useStore.getState().refreshToken();
        if (!refreshed) {
          console.log("Token refresh failed, clearing auth state");
          useStore.getState().clear();
          window.location.href = "/login";
          return false;
        }
        return true;
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
      useStore.getState().clear();
      window.location.href = "/login";
      return false;
    }
  },

  validateToken: async (token = localStorage.getItem("authToken")) => {
    if (!token) {
      console.log("No token provided for validateToken");
      set({ isAuthenticated: false });
      return false;
    }
    try {
      console.log("Validating token with /auth/validate-token");
      const response = await api.get("/auth/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log("403/401 error, attempting token refresh");
        const refreshed = await useStore.getState().refreshToken();
        if (refreshed) {
          return await useStore.getState().validateToken();
        }
        console.log("Token refresh failed, redirecting to login");
        useStore.getState().clear();
        window.location.href = "/login";
        return false;
      }
      console.log("Unexpected error during token validation");
      set({ isAuthenticated: false });
      return false;
    }
  },

  refreshUser: async () => {
    if (isRefreshing) {
      console.log("refreshUser already in progress, skipping");
      return useStore.getState().user;
    }
    isRefreshing = true;

    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      console.log("Skipping refreshUser: called too soon");
      isRefreshing = false;
      return useStore.getState().user;
    }
    lastRefreshTime = now;

    set({ isLoading: true });
    try {
      console.log("Fetching user profile from /api/profile");
      const response = await api.get("/api/profile", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      console.log("Raw /api/profile response:", JSON.stringify(response.data, null, 2));

      const baseUser = response.data?.user || response.data;
      const seller = baseUser?.sellerProfile || {};

      const updatedUser = {
        ...baseUser,
        profilePhoto: baseUser.profilePhoto || seller.profilePhoto || null,
        bio: baseUser.bio || seller.bio || "",
        location: baseUser.location || seller.location || "",
        phone: baseUser.phone || seller.phone || "",
        services: Array.isArray(seller.services) ? seller.services : [],
        profileComplete: !!seller.isComplete,
      };

      set({
        user: updatedUser,
        isLoading: false,
        isAuthenticated: true,
      });
      console.log("Updated user state:", JSON.stringify(updatedUser, null, 2));
      return updatedUser;
    } catch (error) {
      console.error("Refresh user error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("401/403 error, attempting token refresh");
        const refreshed = await useStore.getState().refreshToken();
        if (refreshed) {
          console.log("Token refreshed, retrying refreshUser");
          isRefreshing = false;
          return await useStore.getState().refreshUser();
        }
        console.log("Token refresh failed, clearing state and redirecting");
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        });
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      } else {
        set({ isLoading: false });
      }
      throw error;
    } finally {
      isRefreshing = false;
    }
  },

  fetchServices: async () => {
    set({ servicesLoading: true });
    try {
      const response = await api.get("/api/services", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      cache.services.data = response.data.services || [];
      cache.services.timestamp = Date.now();
      set({
        services: response.data.services || [],
        servicesLoading: false,
      });
    } catch (error) {
      console.error("Fetch services error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({
        services: [],
        servicesLoading: false,
      });
      throw error;
    }
  },

  fetchUserServices: async () => {
    set({ userServicesLoading: true });
    try {
      const response = await api.get("/api/services/user", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      cache.userServices.data = response.data.services || [];
      cache.userServices.timestamp = Date.now();
      set({ userServices: response.data.services, userServicesLoading: false });
    } catch (error) {
      console.error("Fetch user services error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ userServicesLoading: false });
      throw error;
    }
  },

  deleteService: async (serviceId) => {
    try {
      console.log("Deleting service with ID:", serviceId);
      const response = await api.delete(`/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      console.log("Service deleted successfully:", response.data);
      cache.userServices.data = null;
      cache.services.data = null;
      set((state) => ({
        userServices: state.userServices.filter(
          (service) => service.id !== serviceId
        ),
      }));
      await useStore.getState().fetchServices();
      return response.data;
    } catch (error) {
      console.error("Delete service error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  fetchOrders: async () => {
    set({ ordersLoading: true });
    try {
      const response = await api.get("/api/orders?limit=5", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      set({ orders: response.data.orders, ordersLoading: false });
    } catch (error) {
      console.error("Fetch orders error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ ordersLoading: false });
      throw error;
    }
  },

  fetchSellerOrders: async () => {
    set({ sellerOrdersLoading: true });
    try {
      const response = await api.get("/api/seller-orders?limit=5", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
      set({ sellerOrders: response.data, sellerOrdersLoading: false });
    } catch (error) {
      console.error("Fetch seller orders error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ sellerOrdersLoading: false });
      throw error;
    }
  },

  fetchConversations: async () => {
    try {
      const response = await api.get("/api/conversations?limit=5", {
        headers: { Authorization: `Bearer ${useStore.getState().token}` },
      });
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
      });
    } catch (error) {
      console.error("Fetch conversations error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ conversations: [], unreadMessagesCount: 0 });
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
    set({ ordersLoading: true });
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
      const response = await api.put(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${useStore.getState().token}` },
        }
      );
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
        ordersLoading: false,
      }));
      return response.data;
    } catch (error) {
      console.error("Order update error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ ordersLoading: false });
      throw error;
    }
  },

  submitReview: async ({ orderId, rating, comment }) => {
    set({ ordersLoading: true });
    try {
      console.log(`Submitting review for order ${orderId}`);
      const response = await api.post(
        `/api/orders/${orderId}/review`,
        { rating, comment },
        {
          headers: { Authorization: `Bearer ${useStore.getState().token}` },
        }
      );
      console.log(`Review submitted for order ${orderId}:`, response.data);
      set({ ordersLoading: false });
      return response.data;
    } catch (error) {
      console.error("Review submission error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ ordersLoading: false });
      throw error;
    }
  },

  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      console.log("Updating profile with form data:", formData);
      const response = await api.put("/api/profile", formData, {
        headers: {
          Authorization: `Bearer ${useStore.getState().token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Profile update response:", response.data);
      cache.profile = { data: null, timestamp: null, ttl: cache.profile.ttl };
      const updatedUser = await useStore.getState().refreshUser();
      console.log("User state after profile update:", updatedUser);
      set({ isLoading: false });
      return updatedUser;
    } catch (error) {
      console.error("Profile update error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ isLoading: false });
      throw error;
    }
  },

  addService: async (formData) => {
    set({ userServicesLoading: true });
    try {
      console.log("Adding service with data:", formData);
      const response = await api.post("/api/services", formData, {
        headers: {
          Authorization: `Bearer ${useStore.getState().token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Service added successfully:", response.data);
      cache.userServices.data = null;
      cache.services.data = null;
      await useStore.getState().fetchServices();
      await useStore.getState().fetchUserServices();
      set((state) => ({
        userServices: [
          ...state.userServices,
          {
            id: response.data.service.id,
            title: response.data.service.title,
            category: response.data.service.category,
            description: response.data.serviceSeller.description,
            price: response.data.serviceSeller.price,
            experience: response.data.serviceSeller.experience,
          },
        ],
        userServicesLoading: false,
      }));
      return response.data;
    } catch (error) {
      console.error("Add service error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      set({ userServicesLoading: false });
      throw error;
    }
  },
}));

export default useStore;