import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import { FiClock, FiCheck, FiX, FiShoppingBag } from "react-icons/fi";

function Orders() {
  const { user, token, orders, fetchOrders, isLoading } = useStore();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (!token) navigate("/login");
    else {
      fetchOrders(token);
      console.log("Fetched orders:", orders); // Debug
    }
  }, [token, navigate, fetchOrders]);

  useEffect(() => {
    console.log("Orders updated:", orders);
  }, [orders]);

  const handleOrderAction = async (orderId, status) => {
    try {
      await useStore.getState().updateOrderStatusApi(orderId, status);
      setSnack({
        show: true,
        message: `Order ${status.toLowerCase()} successfully!`,
        type: "success",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        3000
      );
    } catch (error) {
      console.error("Failed to update order:", error);
      setSnack({
        show: true,
        message:
          error.response?.data?.error ||
          `Failed to update order to ${status.toLowerCase()}`,
        type: "error",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        3000
      );
    }
  };

  if (isLoading || !user) {
    return (
      <div className="p-10 text-center text-gray-600 font-inter">
        Loading...
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const pastOrders = orders.filter((o) => o.status !== "PENDING");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 mt-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Your Orders
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your service requests and history
          </p>
        </div>

        {snack.show && (
          <div
            className={`fixed top-4 right-4 max-w-sm p-3 rounded-md text-sm flex items-center gap-2 animate-fadeInUp z-50 ${
              snack.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            role="alert"
            aria-live="polite"
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
              onClick={() =>
                setSnack({ show: false, message: "", type: "info" })
              }
              className="ml-auto text-sm font-medium hover:underline"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        )}

        <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <FiClock className="text-cyan-400" />
            {user.role.toLowerCase() === "seller"
              ? "New Requests"
              : "Pending Orders"}
            {pendingOrders.length > 0 && (
              <span className="bg-cyan-400 text-white text-xs font-semibold rounded-full px-2 py-1 ml-2">
                {pendingOrders.length}
              </span>
            )}
          </h2>
          {pendingOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-md bg-white border-l-4 border-cyan-400 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      {order.service?.title || "Unknown Service"}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold rounded px-2 py-1">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.role.toLowerCase() === "seller"
                      ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                      : `Seller: ${order.seller?.name || "Unknown Seller"}`}
                  </p>
                  {user.role.toLowerCase() === "seller" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleOrderAction(order.id, "ACCEPTED")}
                        className="flex items-center gap-1 px-3 py-1 bg-cyan-400 text-gray-900 text-sm font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors"
                        aria-label="Accept order"
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, "REJECTED")}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 hover:shadow-md transition-colors"
                        aria-label="Reject order"
                      >
                        <FiX /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              No pending orders
            </p>
          )}
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <FiShoppingBag className="text-cyan-400" /> Order History
          </h2>
          {pastOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-md bg-white border-l-4 hover:shadow-md transition-shadow ${
                    order.status === "COMPLETED"
                      ? "border-green-400"
                      : "border-orange-400"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      {order.service?.title || "Unknown Service"}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold rounded px-2 py-1">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.role.toLowerCase() === "seller"
                      ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                      : `Seller: ${order.seller?.name || "Unknown Seller"}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              No order history yet
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Orders;
