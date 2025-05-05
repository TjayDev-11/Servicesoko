// pages/Orders.jsx
import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";

function Orders() {
  const { user, token, orders, fetchOrders, updateOrderStatus, isLoading } =
    useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchOrders(token);
  }, [token, navigate, fetchOrders]);

  const handleOrderAction = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status, token);
    } catch (error) {
      console.error("Failed to update order:", error);
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

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pastOrders = orders.filter((o) => o.status !== "pending");

  return (
    <div
      style={{
        padding: "40px",
        width: "100vw",
        margin: "0 auto",
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "#e0e0e0",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: "#bb86fc",
          marginBottom: "24px",
          borderBottom: "1px solid #333",
          paddingBottom: "8px",
        }}
      >
        Your Orders
      </h1>

      {/* New/Pending Orders */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#e0e0e0",
            marginBottom: "16px",
          }}
        >
          {user.role === "seller" ? "New Requests" : "Pending Orders"}
          {pendingOrders.length > 0 && (
            <span
              style={{
                marginLeft: "8px",
                backgroundColor: "#03dac6",
                color: "#000",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "14px",
              }}
            >
              {pendingOrders.length}
            </span>
          )}
        </h2>
        {pendingOrders.length > 0 ? (
          pendingOrders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: "16px",
                backgroundColor: "#1e1e1e",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                marginBottom: "16px",
                borderLeft: "4px solid #03dac6",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: "4px",
                  color: "#ffffff",
                }}
              >
                {order.service.title}
              </p>
              <p style={{ color: "#aaaaaa" }}>
                {user.role === "seller"
                  ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                  : `Seller: ${order.seller?.name || "Unknown Seller"}`}{" "}
                - Status: {order.status}
              </p>
              {user.role === "seller" && (
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleOrderAction(order.id, "accepted")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#03dac6",
                      color: "#000",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleOrderAction(order.id, "declined")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#cf6679",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No pending orders.
          </p>
        )}
      </div>

      {/* Order History */}
      <div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#e0e0e0",
            marginBottom: "16px",
          }}
        >
          Order History
        </h2>
        {pastOrders.length > 0 ? (
          pastOrders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: "16px",
                backgroundColor: "#1e1e1e",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                marginBottom: "16px",
                borderLeft: `4px solid ${
                  order.status === "completed" ? "#bb86fc" : "#cf6679"
                }`,
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: "4px",
                  color: "#ffffff",
                }}
              >
                {order.service.title}
              </p>
              <p style={{ color: "#aaaaaa" }}>
                {user.role === "seller"
                  ? `From: ${order.buyer?.name || "Unknown Buyer"}`
                  : `Seller: ${order.seller?.name || "Unknown Seller"}`}{" "}
                - Status: {order.status}
                <br />
                Date: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No order history yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default Orders;
