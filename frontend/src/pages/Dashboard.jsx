import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import useStore, { validateToken } from "../store";
import api from "../api";
import {
  FaSearch,
  FaChevronRight,
  FaPlus,
  FaStore,
  FaShoppingCart,
  FaHistory,
  FaUserTie,
  FaTools,
} from "react-icons/fa";
import ChatModal from "../components/ChatModal";

// Utility to debounce API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function Dashboard() {
  const {
    token,
    services,
    userServices,
    orders,
    sellerOrders,
    user,
    isLoading,
    error: storeError,
    setLoading,
    setToken,
    refreshUser,
    fetchServices,
    fetchUserServices,
    fetchOrders,
    fetchSellerOrders,
    fetchConversations,
    clear,
  } = useStore();

  const [snack, setSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [showForm, setShowForm] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const initialSellerForm = useMemo(
    () => ({
      name: user?.name || "",
      phone: user?.phone || "",
      location: "",
      gender: "",
      profilePhoto: null,
    }),
    [user]
  );
  const [sellerForm, setSellerForm] = useState(initialSellerForm);

  const navigate = useNavigate();

  // Cache for token validation
  const tokenCache = useMemo(() => ({ valid: null, lastChecked: 0 }), []);

  // Optimized loadData with debouncing and caching
  const loadData = useCallback(
    debounce(async () => {
      if (!token) {
        clear();
        navigate("/login", { replace: true });
        return;
      }

      setLoading(true);
      setLocalLoading(true);

      try {
        // Check cached token validity
        const now = Date.now();
        if (
          tokenCache.valid &&
          now - tokenCache.lastChecked < 30000 // 30 seconds cache
        ) {
          if (!tokenCache.valid) {
            setSnack({
              show: true,
              message: "Invalid session. Please log in again.",
              type: "error",
            });
            clear();
            navigate("/login", { replace: true });
            return;
          }
        } else {
          const user = await validateToken(token);
          tokenCache.valid = !!user;
          tokenCache.lastChecked = now;
          if (!user) {
            setSnack({
              show: true,
              message: "Invalid session. Please log in again.",
              type: "error",
            });
            clear();
            navigate("/login", { replace: true });
            return;
          }
        }

        await refreshUser(token);
        const currentUser = useStore.getState().user;
        const role = currentUser?.role?.evolvesLowerCase();

        // Batch API calls
        const loaders = [fetchServices(token)]; // Always fetch services
        if (role === "buyer" || role === "both") {
          loaders.push(fetchOrders(token));
        }
        if (role === "seller" || role === "both") {
          loaders.push(fetchUserServices(token), fetchSellerOrders(token));
          // Lazy-load conversations to reduce initial load time
          setTimeout(() => fetchConversations(token), 1000);
        }

        await Promise.all(loaders);
      } catch (error) {
        setSnack({
          show: true,
          message:
            error.response?.data?.error || "Failed to load dashboard data",
          type: "error",
        });
      } finally {
        setLoading(false);
        setLocalLoading(false);
      }
    }, 300),
    [
      token,
      navigate,
      clear,
      refreshUser,
      setLoading,
      fetchServices,
      fetchUserServices,
      fetchOrders,
      fetchSellerOrders,
      fetchConversations,
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBecomeSeller = useCallback(async () => {
    try {
      setLocalLoading(true);
      const formData = new FormData();
      Object.entries(sellerForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await api.post("/api/become-seller", formData);
      const data = response.data;

      if (data.accessToken) {
        await setToken(
          data.accessToken,
          data.user,
          localStorage.getItem("refreshToken")
        );
      }

      await refreshUser(data.accessToken || token);
      setSnack({
        show: true,
        message: "You are now a seller! Start adding your services.",
        type: "success",
      });
      setShowForm(false);
      navigate("/add-service");
    } catch (error) {
      setSnack({
        show: true,
        message: error.response?.data?.error || "Failed to become a seller",
        type: "error",
      });
    } finally {
      setLocalLoading(false);
    }
  }, [sellerForm, token, setToken, refreshUser, navigate]);

  const handleOrderUpdate = useCallback(
    async (orderId, status) => {
      try {
        setLocalLoading(true);
        await api.put(`/api/orders/${orderId}/${status.toLowerCase()}`);
        useStore.getState().updateOrderStatus(orderId, status);
        setSnack({
          show: true,
          message: "Order updated successfully!",
          type: "success",
        });
        await fetchSellerOrders(token);
      } catch (error) {
        setSnack({
          show: true,
          message: error.response?.data?.error || "Failed to update order",
          type: "error",
        });
      } finally {
        setLocalLoading(false);
      }
    },
    [token, fetchSellerOrders]
  );

  const openChat = useCallback((seller) => {
    if (!seller?.id) {
      setSnack({
        show: true,
        message: "Cannot open chat: Seller ID is missing",
        type: "error",
      });
      return;
    }
    setSelectedSeller(seller);
    setShowChat(true);
  }, []);

  // Navigate to orders page programmatically
  const handleViewAllOrders = useCallback(() => {
    try {
      navigate("/orders");
    } catch (error) {
      setSnack({
        show: true,
        message: "Failed to load orders page. Please try again.",
        type: "error",
      });
    }
  }, [navigate]);

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "30px 20px",
    },
    content: {
      maxWidth: "1400px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "20px",
    },
    userInfo: {
      display: "flex",
      flexDirection: "column",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1a237e",
      margin: "0",
    },
    subtitle: {
      fontSize: "16px",
      color: "#666",
      margin: "4px 0 0 0",
    },
    actionButtons: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap",
    },
    buttonPrimary: {
      padding: "12px 24px",
      backgroundColor: "#1a237e",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    buttonSecondary: {
      padding: "12px 24px",
      backgroundColor: "#4fc3f7",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      gap: "24px",
      marginBottom: "24px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      height: "100%",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1a237e",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    serviceItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #eee",
    },
    orderItem: {
      padding: "12px 0",
      borderBottom: "1px solid #eee",
    },
    statusBadge: (status) => ({
      backgroundColor:
        status === "PENDING"
          ? "#fff3e0"
          : status === "ACCEPTED" || status === "COMPLETED"
          ? "#e8f5e9"
          : status === "REJECTED"
          ? "#ffebee"
          : "#f5f5f5",
      color:
        status === "PENDING"
          ? "#ff8f00"
          : status === "ACCEPTED" || status === "COMPLETED"
          ? "#2e7d32"
          : status === "REJECTED"
          ? "#c62828"
          : "#666",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block",
    }),
    emptyState: {
      color: "#666",
      fontSize: "14px",
      textAlign: "center",
      padding: "20px",
    },
    formInput: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "15px",
      marginBottom: "16px",
    },
    formLabel: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      color: "#444",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "16px",
    },
    snackSuccess: {
      backgroundColor: "#d4edda",
      color: "#155724",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "24px",
      fontSize: "14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    snackError: {
      backgroundColor: "#ffebee",
      color: "#c62828",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "24px",
      fontSize: "14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {(isLoading || localLoading) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <div
              style={{
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #1a237e",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!isLoading && !localLoading && user && (
          <>
            <div style={styles.header}>
              <div style={styles.userInfo}>
                <h1 style={styles.title}>Welcome, {user.name}</h1>
                <p style={styles.subtitle}>
                  {user.role.toLowerCase() === "both"
                    ? "Buyer & Seller Account"
                    : `${
                        user.role.charAt(0).toUpperCase() +
                        user.role.slice(1).toLowerCase()
                      } Account`}
                </p>
              </div>
              <div style={styles.actionButtons}>
                <button
                  onClick={() => navigate("/services")}
                  style={styles.buttonSecondary}
                >
                  <FaSearch /> Explore Services
                </button>
                {(user.isSeller || user.role.toLowerCase() === "both") && (
                  <button
                    onClick={() => navigate("/add-service")}
                    style={styles.buttonPrimary}
                  >
                    <FaPlus /> Add Service
                  </button>
                )}
              </div>
            </div>

            {storeError && (
              <div style={styles.snackError}>
                <span>{storeError}</span>
                <button
                  onClick={() => useStore.setState({ error: null })}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {snack.show && (
              <div
                style={
                  snack.type === "success"
                    ? styles.snackSuccess
                    : styles.snackError
                }
              >
                <span>{snack.message}</span>
                <button
                  onClick={() => setSnack({ ...snack, show: false })}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            <div style={styles.dashboardGrid}>
              {(user.isSeller || user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaTools /> Your Services
                  </h2>
                  {userServices && userServices.length > 0 ? (
                    <div>
                      {userServices.slice(0, 4).map((service) => (
                        <div key={service.id} style={styles.serviceItem}>
                          <div>
                            <h3
                              style={{
                                fontSize: "16px",
                                fontWeight: "500",
                                marginBottom: "4px",
                              }}
                            >
                              {service.title}
                            </h3>
                            <p style={{ fontSize: "14px", color: "#666" }}>
                              KSh {service.price}
                            </p>
                            <p style={{ fontSize: "14px", color: "#666" }}>
                              Category: {service.category}
                            </p>
                          </div>
                          <Link
                            to={`/services/${service.category}`}
                            style={{
                              color: "#4fc3f7",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            View <FaChevronRight size={12} />
                          </Link>
                        </div>
                      ))}
                      {userServices.length > 4 && (
                        <div style={{ textAlign: "right", marginTop: "12px" }}>
                          <button
                            onClick={() => navigate("/dashboard/services")}
                            style={{
                              color: "#1a237e",
                              fontSize: "14px",
                              fontWeight: "500",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            View all ({userServices.length})
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>
                      No services added yet.{" "}
                      <Link to="/add-service">Add a service</Link>.
                    </p>
                  )}
                </div>
              )}

              {(user.isSeller || user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaShoppingCart /> New Orders to Deliver
                  </h2>
                  {sellerOrders?.newOrders?.length > 0 ? (
                    <div>
                      {sellerOrders.newOrders.slice(0, 4).map((order) => (
                        <div key={order.id} style={styles.orderItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "15px",
                                  fontWeight: "500",
                                  marginBottom: "4px",
                                }}
                              >
                                Order #{order.id.slice(0, 8)}
                              </p>
                              <p style={{ fontSize: "14px", color: "#666" }}>
                                Service: {order.serviceTitle || "Unknown"}
                              </p>
                              <p style={{ fontSize: "14px", color: "#666" }}>
                                Customer: {order.buyerName || "Unknown"}
                              </p>
                            </div>
                            <span style={styles.statusBadge(order.status)}>
                              {order.status}
                            </span>
                          </div>
                          {order.status === "PENDING" && (
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end",
                                marginTop: "8px",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleOrderUpdate(order.id, "ACCEPTED")
                                }
                                style={{
                                  ...styles.buttonPrimary,
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                }}
                                disabled={localLoading}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleOrderUpdate(order.id, "REJECTED")
                                }
                                style={{
                                  ...styles.buttonSecondary,
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                  backgroundColor: "#f44336",
                                }}
                                disabled={localLoading}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {sellerOrders.newOrders.length > 4 && (
                        <div style={{ textAlign: "right", marginTop: "12px" }}>
                          <button
                            onClick={handleViewAllOrders}
                            style={{
                              color: "#1a237e",
                              fontSize: "14px",
                              fontWeight: "500",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            View View all ({sellerOrders.newOrders.length})
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No new orders to deliver</p>
                  )}
                </div>
              )}

              {(user.role.toLowerCase() === "buyer" ||
                user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaShoppingCart /> Your Orders
                  </h2>
                  {orders && orders.length > 0 ? (
                    <div>
                      {orders
                        .filter((order) => order.role === "BUYER")
                        .slice(0, 4)
                        .map((order) => (
                          <div key={order.id} style={styles.orderItem}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Order #{order.id.slice(0, 8)}
                                </p>
                                <p style={{ fontSize: "14px", color: "#666" }}>
                                  Service: {order.serviceTitle || "Unknown"}
                                </p>
                                <p style={{ fontSize: "14px", color: "#666" }}>
                                  Seller: {order.sellerName || "Unknown"}
                                </p>
                              </div>
                              <span style={styles.statusBadge(order.status)}>
                                {order.status}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end",
                                marginTop: "8px",
                              }}
                            >
                              <button
                                onClick={() =>
                                  openChat({
                                    id: order.sellerId,
                                    name: order.sellerName,
                                  })
                                }
                                style={{
                                  ...styles.buttonSecondary,
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                }}
                                disabled={localLoading || !order.sellerId}
                              >
                                Chat with Seller
                              </button>
                            </div>
                          </div>
                        ))}
                      {orders.filter((order) => order.role === "BUYER").length >
                        4 && (
                        <div style={{ textAlign: "right", marginTop: "12px" }}>
                          <button
                            onClick={handleViewAllOrders}
                            style={{
                              color: "#1a237e",
                              fontSize: "14px",
                              fontWeight: "500",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            View all (
                            {
                              orders.filter((order) => order.role === "BUYER")
                                .length
                            }
                            )
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No orders placed yet</p>
                  )}
                </div>
              )}

              {!(user.isSeller || user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaUserTie /> Become a Seller
                  </h2>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "20px",
                      fontSize: "14px",
                    }}
                  >
                    Start offering your services and earn money by joining our
                    professional community.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={styles.buttonPrimary}
                  >
                    <FaStore /> Register as Seller
                  </button>
                </div>
              )}

              {(user.role.toLowerCase() === "buyer" ||
                user.role.toLowerCase() === "both" ||
                user.isSeller ||
                user.role.toLowerCase() === "seller") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaHistory /> Order History
                  </h2>
                  {sellerOrders?.orderHistory?.length > 0 ||
                  orders?.length > 0 ? (
                    <div>
                      {[
                        ...(user.isSeller || user.role.toLowerCase() === "both"
                          ? sellerOrders?.orderHistory || []
                          : orders.filter((order) => order.role === "BUYER") ||
                            []),
                      ]
                        .slice(0, 5)
                        .map((order) => (
                          <div key={order.id} style={styles.orderItem}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Order #{order.id.slice(0, 8)}
                                </p>
                                <p style={{ fontSize: "14px", color: "#666" }}>
                                  Service: {order.serviceTitle || "Unknown"}
                                </p>
                                <p style={{ fontSize: "14px", color: "#666" }}>
                                  {user.isSeller ||
                                  user.role.toLowerCase() === "both"
                                    ? `Customer: ${
                                        order.buyerName || "Unknown"
                                      }`
                                    : `Seller: ${
                                        order.sellerName || "Unknown"
                                      }`}
                                </p>
                              </div>
                              <span style={styles.statusBadge(order.status)}>
                                {order.status}
                              </span>
                            </div>
                            {!(
                              user.isSeller ||
                              user.role.toLowerCase() === "both"
                            ) && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  justifyContent: "flex-end",
                                  marginTop: "8px",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    openChat({
                                      id: order.sellerId,
                                      name: order.sellerName,
                                    })
                                  }
                                  style={{
                                    ...styles.buttonSecondary,
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                  }}
                                  disabled={localLoading || !order.sellerId}
                                >
                                  Chat with Seller
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      {[
                        ...(user.isSeller || user.role.toLowerCase() === "both"
                          ? sellerOrders?.orderHistory || []
                          : orders.filter((order) => order.role === "BUYER") ||
                            []),
                      ].length > 5 && (
                        <div style={{ textAlign: "right", marginTop: "12px" }}>
                          <button
                            onClick={handleViewAllOrders}
                            style={{
                              color: "#1a237e",
                              fontSize: "14px",
                              fontWeight: "500",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            View all (
                            {user.isSeller || user.role.toLowerCase() === "both"
                              ? sellerOrders?.orderHistory?.length || 0
                              : orders.filter((order) => order.role === "BUYER")
                                  .length || 0}
                            )
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No order history</p>
                  )}
                </div>
              )}
            </div>

            {showForm && (
              <div style={{ ...styles.card, marginTop: "24px" }}>
                <h2 style={styles.sectionTitle}>Seller Registration</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBecomeSeller();
                  }}
                >
                  <div>
                    <label style={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      value={sellerForm.name}
                      onChange={(e) =>
                        setSellerForm({ ...sellerForm, name: e.target.value })
                      }
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label style={styles.formLabel}>Phone Number</label>
                      <input
                        type="tel"
                        value={sellerForm.phone}
                        onChange={(e) =>
                          setSellerForm({
                            ...sellerForm,
                            phone: e.target.value,
                          })
                        }
                        style={styles.formInput}
                        required
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Location</label>
                      <input
                        type="text"
                        value={sellerForm.location}
                        onChange={(e) =>
                          setSellerForm({
                            ...sellerForm,
                            location: e.target.value,
                          })
                        }
                        style={styles.formInput}
                        required
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label style={styles.formLabel}>Gender</label>
                      <select
                        value={sellerForm.gender}
                        onChange={(e) =>
                          setSellerForm({
                            ...sellerForm,
                            gender: e.target.value,
                          })
                        }
                        style={styles.formInput}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.formLabel}>Profile Photo</label>
                      <input
                        type="file"
                        onChange={(e) =>
                          setSellerForm({
                            ...sellerForm,
                            profilePhoto: e.target.files[0],
                          })
                        }
                        style={{ ...styles.formInput, padding: "8px" }}
                      />
                    </div>
                  </div>
                  <div style={styles.buttonGroup}>
                    <button
                      type="submit"
                      style={styles.buttonPrimary}
                      disabled={localLoading}
                    >
                      {localLoading ? "Processing..." : "Submit Application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{
                        ...styles.buttonPrimary,
                        backgroundColor: "#666",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showChat && (
              <ChatModal
                seller={selectedSeller}
                onClose={() => setShowChat(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
