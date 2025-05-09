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
      // Log orders to debug missing service fields
      console.log("Fetched orders:", orders);
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
    } catch (error) {
      console.error("Failed to update order:", error);
      setSnack({
        show: true,
        message:
          error.response?.data?.error ||
          `Failed to update order to ${status.toLowerCase()}`,
        type: "error",
      });
    }
  };

  if (isLoading || !user)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#e0e0e0",
        }}
      >
        Loading...
      </div>
    );

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const pastOrders = orders.filter((o) => o.status !== "PENDING");

  return (
    <div className="orders-container">
      <div className="orders-content">
        <div className="orders-header">
          <h1>Your Orders</h1>
          <p>Manage your service requests and history</p>
        </div>

        {snack.show && (
          <div className={`snackbar ${snack.type}`}>
            <span>{snack.message}</span>
            <button onClick={() => setSnack({ ...snack, show: false })}>
              Close
            </button>
          </div>
        )}

        <div className="orders-section">
          <h2>
            <FiClock />{" "}
            {user.role.toLowerCase() === "seller"
              ? "New Requests"
              : "Pending Orders"}
            {pendingOrders.length > 0 && (
              <span className="count-badge">{pendingOrders.length}</span>
            )}
          </h2>
          {pendingOrders.length > 0 ? (
            <div className="orders-grid">
              {pendingOrders.map((order) => (
                <div key={order.id} className="order-card pending">
                  <div className="order-header">
                    <h3>{order.service?.title || "Unknown Service"}</h3>
                    <span className="order-status">{order.status}</span>
                  </div>
                  <p className="order-meta">
                    {user.role.toLowerCase() === "seller"
                      ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                      : `Seller: ${order.seller?.name || "Unknown Seller"}`}
                  </p>
                  {user.role.toLowerCase() === "seller" && (
                    <div className="order-actions">
                      <button
                        onClick={() => handleOrderAction(order.id, "ACCEPTED")}
                        className="accept-button"
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, "REJECTED")}
                        className="reject-button"
                      >
                        <FiX /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No pending orders</p>
          )}
        </div>

        <div className="orders-section">
          <h2>Order History</h2>
          {pastOrders.length > 0 ? (
            <div className="orders-grid">
              {pastOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-card ${
                    order.status === "COMPLETED" ? "completed" : "other"
                  }`}
                >
                  <div className="order-header">
                    <h3>{order.service?.title || "Unknown Service"}</h3>
                    <span className="order-status">{order.status}</span>
                  </div>
                  <p className="order-meta">
                    {user.role.toLowerCase() === "seller"
                      ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                      : `Seller: ${order.seller?.name || "Unknown Seller"}`}
                  </p>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No order history yet</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .orders-container {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 2rem 1rem;
        }

        .orders-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .orders-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .orders-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a237e;
          margin-bottom: 0.5rem;
        }

        .orders-header p {
          font-size: 1rem;
          color: #666;
        }

        .orders-section {
          margin-bottom: 2.5rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .orders-section h2 {
          font-size: 1.25rem;
          color: #1a237e;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .count-badge {
          background-color: #4fc3f7;
          color: white;
          border-radius: 12px;
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
          margin-left: 0.5rem;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .order-card {
          padding: 1.25rem;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          border-left: 4px solid;
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .order-card.pending {
          border-left-color: #4fc3f7;
        }

        .order-card.completed {
          border-left-color: #66bb6a;
        }

        .order-card.other {
          border-left-color: #ff7043;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .order-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
        }

        .order-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background-color: #f5f5f5;
          color: #666;
        }

        .order-meta {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .order-date {
          color: #999;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        .order-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .order-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .accept-button {
          background-color: #4fc3f7;
          color: white;
        }

        .accept-button:hover {
          background-color: #3da8e0;
        }

        .reject-button {
          background-color: #ff7043;
          color: white;
        }

        .reject-button:hover {
          background-color: #f4511e;
        }

        .empty-state {
          color: #999;
          font-style: italic;
          padding: 1rem;
          text-align: center;
        }

        .snackbar {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .snackbar.success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .snackbar.error {
          background-color: #ffebee;
          color: #c62828;
        }

        .snackbar button {
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          margin-left: 1rem;
          color: inherit;
        }

        @media (max-width: 768px) {
          .orders-container {
            padding: 1.5rem;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Orders;
