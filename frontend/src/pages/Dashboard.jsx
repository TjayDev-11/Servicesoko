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
  FaChevronDown,
  FaChevronUp,
  FaTrash,
} from "react-icons/fa";
import ChatModal from "../components/ChatModal";

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
            onClick={() => onDelete(service.id)}
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
  const [isDataReady, setIsDataReady] = useState(false); // New state to track data readiness

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
    setIsDataReady(false); // Reset data readiness

    try {
      const userData = await validateToken(token);
      if (!userData) {
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

      await refreshUser();
      const currentUser = useStore.getState().user;
      const role = currentUser?.role?.toLowerCase() || "buyer";

      const loaders = [fetchServices()];
      if (role === "buyer" || role === "both") {
        loaders.push(fetchOrders());
      }
      if (role === "seller" || role === "both") {
        loaders.push(fetchUserServices(), fetchSellerOrders());
      }

      await Promise.all(loaders);

      // Defer conversations fetch
      setTimeout(async () => {
        try {
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

      // Introduce a slight delay to ensure skeleton loaders persist
      await new Promise((resolve) => setTimeout(resolve, 300));
      setIsDataReady(true); // Mark data as ready
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
        await updateOrderStatusApi(orderId, status);
        setSnack({
          show: true,
          message: "Order updated successfully!",
          type: "success",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
        await fetchSellerOrders();
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
        return;
      }
      try {
        setDeletingServiceId(serviceId);
        await deleteService(serviceId);
        setSnack({
          show: true,
          message: "Service deleted successfully!",
          type: "success",
        });
        setTimeout(() => setSnack({ show: false, message: "", type: "info" }), 2000);
      } catch (error) {
        console.error("Delete service error:", error);
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
    [deleteService]
  );

  const openChat = useCallback((seller) => {
    if (!seller?.id) {
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
                {collapsedSections.services ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronUp className="text-gray-600" />
                )}
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
                  <FaShoppingCart className="text-cyan-400" /> New Orders
                </h2>
                {collapsedSections.newOrders ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronUp className="text-gray-600" />
                )}
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
                      {sellerOrders.newOrders.slice(0, 4).map((order) => (
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
                              <p className="text-xs text-gray-500">{formatTimestamp(order.createdAt)}</p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                order.status === "PENDING"
                                  ? "bg-orange-100 text-orange-600"
                                  : order.status === "ACCEPTED" || order.status === "COMPLETED"
                                  ? "bg-green-100 text-green-600"
                                  : order.status === "REJECTED"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {order.status || "Unknown"}
                            </span>
                          </div>
                          {order.status === "PENDING" && (
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
                        </div>
                      ))}
                      {sellerOrders.newOrders.length > 4 && (
                        <button
                          onClick={handleViewAllOrders}
                          className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                          aria-label="View all new orders"
                        >
                          View all ({sellerOrders.newOrders.length}) <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No new orders to deliver</p>
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
                {collapsedSections.yourOrders ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronUp className="text-gray-600" />
                )}
              </button>
              <CSSTransition in={!collapsedSections.yourOrders} timeout={300} classNames="slide" unmountOnExit>
                <div id="your-orders-section">
                  {isLoading || !isDataReady || !orders ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : orders.length > 0 ? (
                    <div>
                      {orders
                        .filter((order) => order.role === "BUYER")
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
                                <p className="text-xs text-gray-500">{formatTimestamp(order.createdAt)}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  order.status === "PENDING"
                                    ? "bg-orange-100 text-orange-600"
                                    : order.status === "ACCEPTED" || order.status === "COMPLETED"
                                    ? "bg-green-100 text-green-600"
                                    : order.status === "REJECTED"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {order.status || "Unknown"}
                              </span>
                            </div>
                            <div className="flex justify-end mt-2">
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
                        ))}
                      {orders.filter((order) => order.role === "BUYER").length > 4 && (
                        <button
                          onClick={handleViewAllOrders}
                          className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                          aria-label="View all orders"
                        >
                          View all ({orders.filter((order) => order.role === "BUYER").length}){" "}
                          <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No orders placed yet</p>
                  )}
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
                {collapsedSections.history ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronUp className="text-gray-600" />
                )}
              </button>
              <CSSTransition in={!collapsedSections.history} timeout={300} classNames="slide" unmountOnExit>
                <div id="history-section">
                  {isLoading || !isDataReady || (!sellerOrders?.orderHistory && !orders) ? (
                    <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                    </div>
                  ) : (sellerOrders?.orderHistory || orders || []).length > 0 ? (
                    <div>
                      {[
                        ...(user?.isSeller || user?.role?.toLowerCase() === "both"
                          ? sellerOrders?.orderHistory || []
                          : orders?.filter((order) => order.role === "BUYER") || []),
                      ]
                        .slice(0, 5)
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
                                <p className="text-xs text-gray-500">{formatTimestamp(order.createdAt)}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  order.status === "PENDING"
                                    ? "bg-orange-100 text-orange-600"
                                    : order.status === "ACCEPTED" || order.status === "COMPLETED"
                                    ? "bg-green-100 text-green-600"
                                    : order.status === "REJECTED"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {order.status || "Unknown"}
                              </span>
                            </div>
                            {!(user?.isSeller || user?.role?.toLowerCase() === "both") && (
                              <div className="flex justify-end mt-2">
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
                            )}
                          </div>
                        ))}
                      {[
                        ...(user?.isSeller || user?.role?.toLowerCase() === "both"
                          ? sellerOrders?.orderHistory || []
                          : orders?.filter((order) => order.role === "BUYER") || []),
                      ].length > 5 && (
                        <button
                          onClick={handleViewAllOrders}
                          className="text-cyan-400 text-sm font-medium flex items-center gap-1 mt-4 ml-auto hover:text-cyan-500 transition-colors"
                          aria-label="View all order history"
                        >
                          View all (
                          {user?.isSeller || user?.role?.toLowerCase() === "both"
                            ? sellerOrders?.orderHistory?.length || 0
                            : orders?.filter((order) => order.role === "BUYER")?.length || 0}
                          ) <FaChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No order history</p>
                  )}
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