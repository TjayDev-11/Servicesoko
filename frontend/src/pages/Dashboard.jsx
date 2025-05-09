import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import useStore from "../store";
import {
  FaSearch,
  FaChevronRight,
  FaPlus,
  FaStore,
  FaShoppingCart,
  FaHistory,
  FaUserTie,
  FaTools,
  FaRegCheckCircle,
  FaRegTimesCircle,
} from "react-icons/fa";
import ChatModal from "../components/ChatModal";

function Dashboard() {
  const {
    token,
    services,
    userServices,
    orders,
    sellerOrders,
    user,
    isLoading,
    setLoading,
    setToken,
    refreshUser,
    fetchServices,
    fetchUserServices,
    fetchOrders,
    validateToken,
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

  const loadData = useCallback(async () => {
    console.log(
      "loadData called, token:",
      token ? token.substring(0, 10) + "..." : "null"
    );
    if (!token) {
      console.log("No token, clearing state and navigating to login");
      clear();
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setLocalLoading(true);

    try {
      console.log("Validating token");
      const user = await validateToken(token);
      if (!user) {
        console.log("Token invalid, clearing state and navigating to login");
        setSnack({
          show: true,
          message: "Invalid session. Please log in again.",
          type: "error",
        });
        clear();
        navigate("/login", { replace: true });
        return;
      }

      console.log("Refreshing user data");
      await refreshUser(token);
      const currentUser = useStore.getState().user;
      const role = currentUser?.role?.toLowerCase();
      console.log("Current user role:", role);

      const loaders = [fetchServices(token)];
      if (role === "buyer" || role === "both") {
        loaders.push(fetchOrders(token));
      }
      if (role === "seller" || role === "both") {
        loaders.push(fetchUserServices(token), fetchSellerOrders(token));
        setTimeout(async () => {
          try {
            console.log("Fetching conversations");
            await fetchConversations(token);
          } catch (error) {
            console.error("Fetch conversations error:", error);
            setSnack({
              show: true,
              message: "Failed to load conversations",
              type: "error",
            });
          }
        }, 1000);
      }

      console.log("Executing loaders:", loaders.length);
      await Promise.all(loaders);
      console.log("loadData completed successfully");
    } catch (error) {
      console.error("Load data error:", error);
      setSnack({
        show: true,
        message: "Failed to load data. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setLocalLoading(false);
    }
  }, [
    token,
    navigate,
    clear,
    refreshUser,
    fetchServices,
    fetchUserServices,
    fetchOrders,
    fetchSellerOrders,
    fetchConversations,
  ]);

  useEffect(() => {
    console.log("Dashboard useEffect triggered");
    loadData();
  }, [loadData]);

  const handleBecomeSeller = useCallback(async () => {
    try {
      setLocalLoading(true);
      const formData = new FormData();
      Object.entries(sellerForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
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
      console.error("Become seller error:", error);
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
        await useStore.getState().updateOrderStatusApi(orderId, status);
        setSnack({
          show: true,
          message: "Order updated successfully!",
          type: "success",
        });
        await fetchSellerOrders(token);
      } catch (error) {
        console.error("Order update error:", error);
        setSnack({
          show: true,
          message:
            error.response?.data?.error ||
            `Failed to update order to ${status.toLowerCase()}`,
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

  const handleViewAllOrders = useCallback(() => {
    navigate("/orders");
  }, [navigate]);

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "2rem 1rem",
    },
    content: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      marginBottom: "2rem",
    },
    userInfo: {
      display: "flex",
      flexDirection: "column",
    },
    title: {
      fontSize: "1.75rem",
      fontWeight: "700",
      color: "#1a237e",
      margin: "0",
    },
    subtitle: {
      fontSize: "1rem",
      color: "#666",
      margin: "0.25rem 0 0 0",
    },
    actionButtons: {
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap",
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      fontSize: "0.9rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      border: "none",
    },
    buttonPrimary: {
      backgroundColor: "#1a237e",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#4fc3f7",
      color: "white",
    },
    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      height: "100%",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      },
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "#1a237e",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    serviceItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 0",
      borderBottom: "1px solid #eee",
      transition: "background-color 0.2s ease",
      ":hover": {
        backgroundColor: "#f8f9fa",
      },
    },
    orderItem: {
      padding: "1rem 0",
      borderBottom: "1px solid #eee",
      transition: "background-color 0.2s ease",
      ":hover": {
        backgroundColor: "#f8f9fa",
      },
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
      padding: "0.25rem 0.5rem",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: "600",
      display: "inline-block",
    }),
    emptyState: {
      color: "#666",
      fontSize: "0.9rem",
      textAlign: "center",
      padding: "1.5rem",
    },
    viewAllButton: {
      color: "#1a237e",
      fontSize: "0.9rem",
      fontWeight: "500",
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      marginTop: "1rem",
      marginLeft: "auto",
    },
    actionButtonGroup: {
      display: "flex",
      gap: "0.5rem",
      justifyContent: "flex-end",
      marginTop: "0.5rem",
    },
    smallButton: {
      padding: "0.375rem 0.75rem",
      fontSize: "0.75rem",
      borderRadius: "6px",
    },
    snack: {
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1.5rem",
      fontSize: "0.9rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    snackSuccess: {
      backgroundColor: "#d4edda",
      color: "#155724",
    },
    snackError: {
      backgroundColor: "#ffebee",
      color: "#c62828",
    },
    formInput: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "0.9rem",
      marginBottom: "1rem",
    },
    formLabel: {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: "500",
      color: "#444",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem",
      "@media (max-width: 600px)": {
        gridTemplateColumns: "1fr",
      },
    },
    loadingSpinner: {
      border: "4px solid #f3f3f3",
      borderTop: "4px solid #1a237e",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 1s linear infinite",
      margin: "2rem auto",
    },
    "@media (max-width: 768px)": {
      container: {
        padding: "1.5rem 1rem",
      },
      dashboardGrid: {
        gridTemplateColumns: "1fr",
      },
      card: {
        padding: "1.25rem",
      },
    },
    "@media (max-width: 480px)": {
      title: {
        fontSize: "1.5rem",
      },
      subtitle: {
        fontSize: "0.9rem",
      },
      button: {
        padding: "0.6rem 1rem",
        fontSize: "0.8rem",
      },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {(isLoading || localLoading) && (
          <div style={styles.loadingSpinner}>
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
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                >
                  <FaSearch /> Explore Services
                </button>
                {(user.isSeller || user.role.toLowerCase() === "both") && (
                  <button
                    onClick={() => navigate("/add-service")}
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                  >
                    <FaPlus /> Add Service
                  </button>
                )}
              </div>
            </div>

            {snack.show && (
              <div
                style={{
                  ...styles.snack,
                  ...(snack.type === "success"
                    ? styles.snackSuccess
                    : styles.snackError),
                }}
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
              {/* Your Services Card */}
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
                                fontSize: "1rem",
                                fontWeight: "500",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {service.title}
                            </h3>
                            <p style={{ fontSize: "0.875rem", color: "#666" }}>
                              KSh {service.price}
                            </p>
                          </div>
                          <Link
                            to={`/services/${service.category}`}
                            style={{
                              color: "#4fc3f7",
                              fontSize: "0.875rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            View <FaChevronRight size={12} />
                          </Link>
                        </div>
                      ))}
                      {userServices.length > 4 && (
                        <button
                          onClick={() => navigate("/dashboard/services")}
                          style={styles.viewAllButton}
                        >
                          View all ({userServices.length}){" "}
                          <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>
                      No services added yet.{" "}
                      <Link to="/add-service" style={{ color: "#1a237e" }}>
                        Add a service
                      </Link>
                      .
                    </p>
                  )}
                </div>
              )}

              {/* New Orders Card */}
              {(user.isSeller || user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaShoppingCart /> New Orders
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
                                  fontSize: "0.9375rem",
                                  fontWeight: "500",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                Order #{order.id.slice(0, 8)}
                              </p>
                              <p
                                style={{ fontSize: "0.875rem", color: "#666" }}
                              >
                                {order.serviceTitle || "Unknown"}
                              </p>
                            </div>
                            <span style={styles.statusBadge(order.status)}>
                              {order.status}
                            </span>
                          </div>
                          {order.status === "PENDING" && (
                            <div style={styles.actionButtonGroup}>
                              <button
                                onClick={() =>
                                  handleOrderUpdate(order.id, "ACCEPTED")
                                }
                                style={{
                                  ...styles.button,
                                  ...styles.buttonPrimary,
                                  ...styles.smallButton,
                                }}
                                disabled={localLoading}
                              >
                                <FaRegCheckCircle /> Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleOrderUpdate(order.id, "REJECTED")
                                }
                                style={{
                                  ...styles.button,
                                  ...styles.smallButton,
                                  backgroundColor: "#f44336",
                                  color: "white",
                                }}
                                disabled={localLoading}
                              >
                                <FaRegTimesCircle /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {sellerOrders.newOrders.length > 4 && (
                        <button
                          onClick={handleViewAllOrders}
                          style={styles.viewAllButton}
                        >
                          View all ({sellerOrders.newOrders.length}){" "}
                          <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No new orders to deliver</p>
                  )}
                </div>
              )}

              {/* Your Orders Card (for buyers) */}
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
                                    fontSize: "0.9375rem",
                                    fontWeight: "500",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  Order #{order.id.slice(0, 8)}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#666",
                                  }}
                                >
                                  {order.serviceTitle || "Unknown"}
                                </p>
                              </div>
                              <span style={styles.statusBadge(order.status)}>
                                {order.status}
                              </span>
                            </div>
                            <div style={styles.actionButtonGroup}>
                              <button
                                onClick={() =>
                                  openChat({
                                    id: order.sellerId,
                                    name: order.sellerName,
                                  })
                                }
                                style={{
                                  ...styles.button,
                                  ...styles.buttonSecondary,
                                  ...styles.smallButton,
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
                        <button
                          onClick={handleViewAllOrders}
                          style={styles.viewAllButton}
                        >
                          View all (
                          {
                            orders.filter((order) => order.role === "BUYER")
                              .length
                          }
                          ) <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No orders placed yet</p>
                  )}
                </div>
              )}

              {/* Become a Seller Card */}
              {!(user.isSeller || user.role.toLowerCase() === "both") && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <FaUserTie /> Become a Seller
                  </h2>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "1.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Start offering your services and earn money by joining our
                    professional community.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                  >
                    <FaStore /> Register as Seller
                  </button>
                </div>
              )}

              {/* Order History Card */}
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
                                    fontSize: "0.9375rem",
                                    fontWeight: "500",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  Order #{order.id.slice(0, 8)}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#666",
                                  }}
                                >
                                  {order.serviceTitle || "Unknown"}
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
                              <div style={styles.actionButtonGroup}>
                                <button
                                  onClick={() =>
                                    openChat({
                                      id: order.sellerId,
                                      name: order.sellerName,
                                    })
                                  }
                                  style={{
                                    ...styles.button,
                                    ...styles.buttonSecondary,
                                    ...styles.smallButton,
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
                        <button
                          onClick={handleViewAllOrders}
                          style={styles.viewAllButton}
                        >
                          View all (
                          {user.isSeller || user.role.toLowerCase() === "both"
                            ? sellerOrders?.orderHistory?.length || 0
                            : orders.filter((order) => order.role === "BUYER")
                                .length || 0}
                          ) <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p style={styles.emptyState}>No order history</p>
                  )}
                </div>
              )}
            </div>

            {/* Seller Registration Form */}
            {showForm && (
              <div style={{ ...styles.card, marginTop: "1.5rem" }}>
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
                  <div style={styles.formGrid}>
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
                  <div style={styles.formGrid}>
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
                        style={{ ...styles.formInput, padding: "0.5rem" }}
                      />
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
                    <button
                      type="submit"
                      style={{ ...styles.button, ...styles.buttonPrimary }}
                      disabled={localLoading}
                    >
                      {localLoading ? "Processing..." : "Submit Application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{
                        ...styles.button,
                        backgroundColor: "#666",
                        color: "white",
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
