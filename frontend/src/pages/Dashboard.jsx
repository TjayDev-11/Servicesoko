import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
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
  FaTrash,
  FaStar,
} from "react-icons/fa";
import ChatModal from "../components/ChatModal";
import ReviewModal from "../components/ReviewModal"; // Import ReviewModal

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
);

// Memoized Service Item
const ServiceItem = memo(({ service, onDelete, deletingServiceId }) => {
  return (
    <CSSTransition key={service.id} timeout={300} classNames="fade">
      <div className="flex justify-between items-center py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            {service.title || "Untitled"}
          </h3>
          <p className="text-sm text-gray-600">KSh {service.price || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/services`}
            className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-500 transition-colors"
            aria-label={`View ${service.title || "service"} details`}
          >
            View <FaChevronRight size={12} />
          </Link>
          <button
            onClick={() => {
              console.log(`Attempting to delete service with ID: ${service.id}`);
              onDelete(service.id);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            disabled={deletingServiceId === service.id}
            aria-label={`Delete ${service.title || "service"}`}
          >
            {deletingServiceId === service.id ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaTrash size={12} />
            )}
          </button>
        </div>
      </div>
    </CSSTransition>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const {
    token,
    services,
    userServices,
    orders,
    sellerOrders,
    user,
    isLoading,
    setLoading,
    refreshUser,
    fetchServices,
    fetchUserServices,
    fetchOrders,
    validateToken,
    fetchSellerOrders,
    fetchConversations,
    clear,
    updateOrderStatusApi,
    deleteService,
    submitReview,
  } = useStore();

  const [snack, setSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [showChat, setShowChat] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    services: false,
    newOrders: false,
    yourOrders: false,
    history: false,
  });
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState({});
  const [reviewedOrders, setReviewedOrders] = useState(new Set()); // Track reviewed orders

  const formatTimestamp = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const loadData = useCallback(async () => {
    if (!token) {
      console.log("No token found, redirecting to login");
      setSnack({
        show: true,
        message: "No session found. Please log in.",
        type: "error",
      });
      setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      clear();
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setIsDataReady(false);

    try {
      console.log("Validating token");
      const userData = await validateToken(token);
      if (!userData) {
        console.log("Invalid token, redirecting to login");
        setSnack({
          show: true,
          message: "Invalid session. Please log in again.",
          type: "error",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        clear();
        navigate("/login", { replace: true });
        return;
      }

      console.log("Refreshing user data");
      await refreshUser();
      const currentUser = useStore.getState().user;
      const role = currentUser?.role?.toLowerCase() || "buyer";
      console.log(`User role: ${role}`);

      const loaders = [fetchServices()];
      if (role === "buyer" || role === "both") {
        console.log("Fetching buyer orders");
        loaders.push(fetchOrders().catch((error) => {
          console.error("fetchOrders error:", error);
          setSnack({
            show: true,
            message: "Failed to load orders. Please try again.",
            type: "error",
          });
          setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
          return [];
        }));
      }
      if (role === "seller" || role === "both") {
        loaders.push(fetchUserServices(), fetchSellerOrders());
      }

      console.log("Fetching data with loaders:", loaders);
      await Promise.all(loaders);

      console.log("Raw orders:", useStore.getState().orders);
      console.log("Seller Orders Loaded:", useStore.getState().sellerOrders);

      setTimeout(async () => {
        try {
          console.log("Fetching conversations");
          await fetchConversations();
        } catch (error) {
          console.error("Conversation fetch error:", error);
          setSnack({
            show: true,
            message: "Failed to load conversations",
            type: "error",
          });
          setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        }
      }, 2000);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setIsDataReady(true);
    } catch (error) {
      console.error("Load data error:", error);
      setSnack({
        show: true,
        message: "Failed to load data. Please try again.",
        type: "error",
      });
      setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
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
    setLoading,
    validateToken,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOrderUpdate = useCallback(
    async (orderId, status) => {
      if (!updateOrderStatusApi) {
        console.error("updateOrderStatusApi is not defined in store");
        setSnack({
          show: true,
          message: "Order update functionality is unavailable",
          type: "error",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        return;
      }
      try {
        console.log(`Updating order ${orderId} to status ${status}`);
        await updateOrderStatusApi(orderId, status);
        setSnack({
          show: true,
          message: `Order ${status.toLowerCase()} successfully!`,
          type: "success",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        await fetchSellerOrders();
        console.log("Seller Orders After Update:", useStore.getState().sellerOrders);
      } catch (error) {
        console.error("Order update error:", error);
        setSnack({
          show: true,
          message:
            error.response?.data?.error || `Failed to update order to ${status.toLowerCase()}`,
          type: "error",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      }
    },
    [fetchSellerOrders, updateOrderStatusApi]
  );

  const handleDeleteService = useCallback(
    async (serviceId) => {
      if (!window.confirm("Are you sure you want to delete this service?")) {
        console.log("Service deletion cancelled by user");
        return;
      }
      console.log(`Initiating deletion of service with ID: ${serviceId}`);
      try {
        setDeletingServiceId(serviceId);
        if (!deleteService) {
          throw new Error("deleteService function is not defined in store");
        }
        await deleteService(serviceId);
        console.log(`Service with ID ${serviceId} deleted successfully`);
        setSnack({
          show: true,
          message: "Service deleted successfully!",
          type: "success",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        await fetchUserServices();
      } catch (error) {
        console.error("Delete service error:", {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });
        setSnack({
          show: true,
          message: error.response?.data?.error || "Failed to delete service",
          type: "error",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      } finally {
        setDeletingServiceId(null);
      }
    },
    [deleteService, fetchUserServices]
  );

  const handleSubmitReview = useCallback(
    async ({ orderId, serviceId, rating, comment }) => {
      console.log("handleSubmitReview called with:", { orderId, serviceId, rating, comment });
      try {
        if (!orderId || !serviceId) {
          throw new Error(`Missing required fields: ${!orderId ? "orderId" : ""} ${!serviceId ? "serviceId" : ""}`);
        }
        await submitReview({ orderId, serviceId, rating, comment });
        console.log(`Review submitted successfully for orderId: ${orderId}, serviceId: ${serviceId}`);
        setSnack({
          show: true,
          message: "Review submitted successfully!",
          type: "success",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        setShowReviewForm((prev) => ({ ...prev, [orderId]: false }));
        setReviewedOrders((prev) => new Set([...prev, orderId])); // Mark order as reviewed
        await fetchOrders();
      } catch (error) {
        console.error("Review submission error:", {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });
        setSnack({
          show: true,
          message: error.response?.data?.error || "Failed to submit review",
          type: "error",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      }
    },
    [submitReview, fetchOrders]
  );

  const openChat = useCallback((seller) => {
    if (!seller?.id) {
      console.log("Cannot open chat: Seller ID is missing");
      setSnack({
        show: true,
        message: "Cannot open chat: Seller ID is missing",
        type: "error",
      });
      setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      return;
    }
    setSelectedSeller({
      id: seller.id,
      name: seller.name,
      image: seller.image || null,
    });
    setShowChat(true);
  }, []);

  const handleViewAllOrders = useCallback(() => {
    navigate("/orders");
  }, [navigate]);

  const toggleSection = useCallback((section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter transition-opacity duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {isLoading || !isDataReady || !user ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-5">
                    Welcome, {user?.name || "User"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-3">
                    {user?.role?.toLowerCase() === "both"
                      ? "Buyer & Seller Account"
                      : user?.role
                      ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()} Account`
                      : "Account"}
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              {isLoading || !isDataReady || !user ? (
                <div className="animate-pulse flex gap-3">
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/services")}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors text-sm"
                    aria-label="Explore services"
                  >
                    <FaSearch /> Explore Services
                  </button>
                  {(user?.isSeller || user?.role?.toLowerCase() === "both") && (
                    <button
                      onClick={() => navigate("/add-service")}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors text-sm"
                      aria-label="Add service"
                    >
                      <FaPlus /> Add Service
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {snack.show && (
          <div
            className={`fixed top-4 right-4 max-w-sm p-3 rounded-md text-sm flex items-center gap-2 animate-fadeInUp z-50 ${
              snack.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {snack.type === "success" ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {snack.message}
            <button
              onClick={() => setSnack({ show: false, message: "", type: "info" })}
              className="ml-auto text-sm font-medium hover:underline"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(user?.isSeller || user?.role?.toLowerCase() === "both") && (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection("services")}
                className="flex items-center justify-between w-full mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                aria-expanded={!collapsedSections.services}
                aria-controls="services-section"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaTools className="text-cyan-400" /> Your Services
                </h2>
              </button>
              <CSSTransition in={!collapsedSections.services} timeout={300} classNames="slide" unmountOnExit>
                <div id="services-section">
                  {isLoading || !isDataReady || !userServices ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : userServices.length > 0 ? (
                    <TransitionGroup>
                      {userServices.slice(0, 4).map((service) => (
                        <ServiceItem
                          key={service.id}
                          service={service}
                          onDelete={handleDeleteService}
                          deletingServiceId={deletingServiceId}
                        />
                      ))}
                    </TransitionGroup>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No services added yet.{" "}
                      <Link to="/add-service" className="text-cyan-400 hover:text-cyan-500">
                        Add a service
                      </Link>
                      .
                    </p>
                  )}
                  {userServices?.length > 4 && (
                    <button
                      onClick={() => navigate("/dashboard/services")}
                      className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                      aria-label="View all services"
                    >
                      View all ({userServices.length}) <FaChevronRight size={12} />
                    </button>
                  )}
                </div>
              </CSSTransition>
            </section>
          )}

          {(user?.isSeller || user?.role?.toLowerCase() === "both") && (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection("newOrders")}
                className="flex items-center justify-between w-full mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                aria-expanded={!collapsedSections.newOrders}
                aria-controls="new-orders-section"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaShoppingCart className="text-cyan-400" /> New Orders to Deliver
                </h2>
              </button>
              <CSSTransition in={!collapsedSections.newOrders} timeout={300} classNames="slide" unmountOnExit>
                <div id="new-orders-section">
                  {isLoading || !isDataReady || !sellerOrders?.newOrders ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : sellerOrders.newOrders.length > 0 ? (
                    <div>
                      {sellerOrders.newOrders
                        .filter((order) => ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(order.status?.toUpperCase()))
                        .slice(0, 4)
                        .map((order) => (
                          <div
                            key={order.id}
                            className="py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-base font-medium text-gray-900">
                                  Order #{order.id?.slice(0, 8) || "N/A"}
                                </p>
                                <p className="text-sm text-gray-600">{order.serviceTitle || "Unknown"}</p>
                                <p className="text-xs text-gray-500">
                                  Created: {formatTimestamp(order.createdAt)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Booking: {formatTimestamp(order.bookingDate)}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  order.status?.toUpperCase() === "PENDING"
                                    ? "bg-orange-100 text-orange-600"
                                    : order.status?.toUpperCase() === "ACCEPTED" || order.status?.toUpperCase() === "IN_PROGRESS"
                                    ? "bg-green-100 text-green-600"
                                    : order.status?.toUpperCase() === "REJECTED"
                                    ? "bg-red-100 text-red-600"
                                    : order.status?.toUpperCase() === "COMPLETED"
                                    ? "bg-blue-100 text-blue-600"
                                    : order.status?.toUpperCase() === "CANCELLED"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {order.status || "Unknown"}
                              </span>
                            </div>
                            {order.status?.toUpperCase() === "PENDING" && (
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => handleOrderUpdate(order.id, "ACCEPTED")}
                                  className="flex items-center gap-1 px-3 py-1 bg-cyan-400 text-gray-900 text-sm font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  disabled={!order.id}
                                  aria-label="Accept order"
                                >
                                  <FaRegCheckCircle /> Accept
                                </button>
                                <button
                                  onClick={() => handleOrderUpdate(order.id, "REJECTED")}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  disabled={!order.id}
                                  aria-label="Reject order"
                                >
                                  <FaRegTimesCircle /> Reject
                                </button>
                              </div>
                            )}
                            {(order.status?.toUpperCase() === "ACCEPTED" || order.status?.toUpperCase() === "IN_PROGRESS") && (
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => handleOrderUpdate(order.id, "COMPLETED")}
                                  className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  disabled={!order.id}
                                  aria-label="Complete order"
                                >
                                  <FaRegCheckCircle /> Complete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      {sellerOrders.newOrders.filter((order) =>
                        ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(order.status?.toUpperCase())
                      ).length > 4 && (
                        <button
                          onClick={handleViewAllOrders}
                          className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                          aria-label="View all new orders to deliver"
                        >
                          View all (
                          {sellerOrders.newOrders.filter((order) =>
                            ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(order.status?.toUpperCase())
                          ).length}
                          ) <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No new orders to deliver
                    </p>
                  )}
                </div>
              </CSSTransition>
            </section>
          )}

          {(user?.role?.toLowerCase() === "buyer" || user?.role?.toLowerCase() === "both") && (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection("yourOrders")}
                className="flex items-center justify-between w-full mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                aria-expanded={!collapsedSections.yourOrders}
                aria-controls="your-orders-section"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaShoppingCart className="text-cyan-400" /> Your Orders
                </h2>
              </button>
              <CSSTransition in={!collapsedSections.yourOrders} timeout={300} classNames="slide" unmountOnExit>
                <div id="your-orders-section">
                  {isLoading || !isDataReady ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No orders found. <Link to="/services" className="text-cyan-400 hover:text-cyan-500">Explore services</Link>.
                    </p>
                  ) : (() => {
                    const activeOrders = orders.filter((order) => {
                      const orderRole = order.role?.toUpperCase() || "BUYER";
                      if (orderRole !== "BUYER") {
                        console.log(`Order ${order.id} skipped: role is ${orderRole}`);
                        return false;
                      }
                      const status = order.status?.toUpperCase() || "";
                      const isActive = ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(status);
                      if (!isActive) {
                        console.log(`Order ${order.id} skipped: status is ${status}`);
                      }
                      return isActive;
                    });
                    console.log("Your Orders filtered:", activeOrders.map(o => ({ id: o.id, status: o.status, role: o.role })));
                    return activeOrders.length > 0 ? (
                      <div>
                        {activeOrders.slice(0, 4).map((order) => {
                          console.log("Your Orders order:", { id: order.id, serviceId: order.serviceId, status: order.status, role: order.role });
                          return (
                            <div
                              key={order.id}
                              className="py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-base font-medium text-gray-900">
                                    Order #{order.id?.slice(0, 8) || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600">{order.serviceTitle || "Unknown"}</p>
                                  <p className="text-xs text-gray-500">
                                    Created: {formatTimestamp(order.createdAt)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Booking: {formatTimestamp(order.bookingDate)}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    order.status?.toUpperCase() === "PENDING"
                                      ? "bg-orange-100 text-orange-600"
                                      : order.status?.toUpperCase() === "ACCEPTED" || order.status?.toUpperCase() === "IN_PROGRESS"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {order.status || "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() =>
                                    openChat({
                                      id: order.sellerId,
                                      name: order.sellerName,
                                      image: order.sellerImage || null,
                                    })
                                  }
                                  className="flex items-center gap-1 px-3 py-1 bg-cyan-400 text-gray-900 text-sm font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  disabled={!order.sellerId}
                                  aria-label="Chat with seller"
                                >
                                  Chat with Seller
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {activeOrders.length > 4 && (
                          <button
                            onClick={handleViewAllOrders}
                            className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                            aria-label="View all active orders"
                          >
                            View all ({activeOrders.length}) <FaChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-4">
                        No active orders (Pending, Accepted, In Progress).
                      </p>
                    );
                  })()}
                </div>
              </CSSTransition>
            </section>
          )}

          {!(user?.isSeller || user?.role?.toLowerCase() === "both") && (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <FaUserTie className="text-cyan-400" /> Become a Seller
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Start offering your services and earn money by joining our professional community.
              </p>
              <Link
                to="/become-seller"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors w-full sm:w-auto"
                aria-label="Register as seller"
              >
                <FaStore /> Register as Seller
              </Link>
            </section>
          )}

          {(user?.role?.toLowerCase() === "buyer" ||
            user?.role?.toLowerCase() === "both" ||
            user?.isSeller ||
            user?.role?.toLowerCase() === "seller") && (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection("history")}
                className="flex items-center justify-between w-full mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                aria-expanded={!collapsedSections.history}
                aria-controls="history-section"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaHistory className="text-cyan-400" /> Order History
                </h2>
              </button>
              <CSSTransition in={!collapsedSections.history} timeout={300} classNames="slide" unmountOnExit>
                <div id="history-section">
                  {isLoading || !isDataReady ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : !orders && !sellerOrders?.orderHistory ? (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No order history available.
                    </p>
                  ) : (() => {
                    const historyOrders = [
                      ...(user?.isSeller || user?.role?.toLowerCase() === "both"
                        ? sellerOrders?.orderHistory || []
                        : orders?.filter((order) => {
                            const orderRole = order.role?.toUpperCase() || "BUYER";
                            if (orderRole !== "BUYER") {
                              console.log(`Order ${order.id} skipped in history: role is ${orderRole}`);
                              return false;
                            }
                            const status = order.status?.toUpperCase() || "";
                            const isHistory = ["COMPLETED", "REJECTED", "CANCELLED"].includes(status);
                            if (!isHistory) {
                              console.log(`Order ${order.id} skipped in history: status is ${status}`);
                            }
                            return isHistory;
                          }) || []),
                    ];
                    console.log("Order History filtered:", historyOrders.map(o => ({ id: o.id, status: o.status, role: o.role })));
                    return historyOrders.length > 0 ? (
                      <div>
                        {historyOrders.slice(0, 5).map((order) => {
                          console.log("Order History order:", { id: order.id, serviceId: order.serviceId, status: order.status, role: order.role });
                          const isReviewed = reviewedOrders.has(order.id);
                          return (
                            <div
                              key={order.id}
                              className="py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-base font-medium text-gray-900">
                                    Order #{order.id?.slice(0, 8) || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600">{order.serviceTitle || "Unknown"}</p>
                                  <p className="text-xs text-gray-500">
                                    Created: {formatTimestamp(order.createdAt)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Booking: {formatTimestamp(order.bookingDate)}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    order.status?.toUpperCase() === "COMPLETED"
                                      ? "bg-blue-100 text-blue-600"
                                      : order.status?.toUpperCase() === "REJECTED"
                                      ? "bg-red-100 text-red-600"
                                      : order.status?.toUpperCase() === "CANCELLED"
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {order.status || "Unknown"}
                                </span>
                              </div>
                              {order.role?.toUpperCase() === "BUYER" && (
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      openChat({
                                        id: order.sellerId,
                                        name: order.sellerName,
                                        image: order.sellerImage || null,
                                      })
                                    }
                                    className="flex items-center gap-1 px-3 py-1 bg-cyan-400 text-gray-900 text-sm font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    disabled={!order.sellerId}
                                    aria-label="Chat with seller"
                                  >
                                    Chat with Seller
                                  </button>
                                  {order.status?.toUpperCase() === "COMPLETED" && (
                                    isReviewed ? (
                                      <button
                                        className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-600 text-sm font-medium rounded-md cursor-not-allowed transition-colors"
                                        disabled
                                        aria-label="Service reviewed"
                                      >
                                        <FaStar /> Reviewed
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setShowReviewForm((prev) => ({
                                            ...prev,
                                            [order.id]: !prev[order.id],
                                          }))
                                        }
                                        className="flex items-center gap-1 px-3 py-1 bg-yellow-400 text-gray-900 text-sm font-medium rounded-md hover:bg-yellow-500 hover:shadow-md transition-colors"
                                        aria-label="Review service"
                                      >
                                        <FaStar /> Review
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                              {showReviewForm[order.id] && order.status?.toUpperCase() === "COMPLETED" && order.role?.toUpperCase() === "BUYER" && (
                                <ReviewModal
                                  orderId={order.id}
                                  serviceId={order.serviceId || order.service?.id}
                                  onSubmit={handleSubmitReview}
                                  onClose={() =>
                                    setShowReviewForm((prev) => ({ ...prev, [order.id]: false }))
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                        {historyOrders.length > 5 && (
                          <button
                            onClick={handleViewAllOrders}
                            className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                            aria-label="View all order history"
                          >
                            View all ({historyOrders.length}) <FaChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-4">
                        No order history (Completed, Rejected, Cancelled).
                      </p>
                    );
                  })()}
                </div>
              </CSSTransition>
            </section>
          )}
        </div>

        {showChat && selectedSeller && (
          <ChatModal seller={selectedSeller} onClose={() => setShowChat(false)} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;