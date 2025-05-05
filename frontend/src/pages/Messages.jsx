import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Messages() {
  const { user, token } = useStore();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
    } else {
      fetchConversations();
    }
  }, [token, user, navigate]);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (receiverId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/${receiverId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedMessages = response.data.messages || [];
      // Validate messages to ensure they have required fields
      const validMessages = fetchedMessages.filter(
        (msg) => msg && msg.id && msg.sender?.id && msg.content
      );
      setMessages(validMessages);
      await fetchConversations(); // Refresh unread counts
    } catch (error) {
      console.error("Failed to fetch messages:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError("Failed to load messages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !user?.id) {
      setError("Cannot send message: Invalid input or user data.");
      return;
    }

    const messageToSend = {
      id: Date.now().toString(),
      sender: { id: user.id, name: user.name },
      receiver: {
        id: selectedUserId,
        name:
          conversations.find((c) => c.id === selectedUserId)?.name || "Unknown",
      },
      content: newMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    try {
      setMessages((prev) => [...prev, messageToSend]);
      setNewMessage("");
      const response = await axios.post(
        "http://localhost:5000/api/messages",
        { receiverId: selectedUserId, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update optimistic message with server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageToSend.id ? response.data.message : msg
        )
      );
      await fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToSend.id));
      setNewMessage(messageToSend.content);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleSelectConversation = (userId) => {
    setSelectedUserId(userId);
    setError(null);
    fetchMessages(userId);
  };

  if (!user) {
    return (
      <div
        style={{
          padding: "40px",
          color: "#e0e0e0",
          textAlign: "center",
          backgroundColor: "#121212",
          minHeight: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        width: "100vw",
        margin: "0 auto",
        display: "flex",
        gap: "24px",
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "#e0e0e0",
      }}
    >
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #333",
          paddingRight: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#bb86fc",
            marginBottom: "16px",
            borderBottom: "1px solid #333",
            paddingBottom: "8px",
          }}
        >
          Conversations
        </h2>
        {isLoading && !conversations.length ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>Loading...</p>
        ) : conversations.length > 0 ? (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              style={{
                padding: "12px",
                cursor: "pointer",
                borderBottom: "1px solid #333",
                backgroundColor:
                  selectedUserId === conv.id ? "#1e1e1e" : "transparent",
                fontWeight: conv.unreadCount > 0 ? "bold" : "normal",
                color: conv.unreadCount > 0 ? "#ffffff" : "#e0e0e0",
                transition: "background-color 0.2s",
              }}
            >
              {conv.name}
              {conv.unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "#cf6679",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {conv.unreadCount}
                </span>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No conversations yet.
          </p>
        )}
      </div>
      <div
        style={{
          width: "70%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#bb86fc",
            marginBottom: "16px",
            borderBottom: "1px solid #333",
            paddingBottom: "8px",
          }}
        >
          {selectedUserId
            ? `Chat with ${
                conversations.find((c) => c.id === selectedUserId)?.name ||
                "Unknown"
              }`
            : "Select a conversation"}
        </h2>
        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#cf6679",
              color: "white",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}
        {selectedUserId && (
          <>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "16px",
                backgroundColor: "#1e1e1e",
                borderRadius: "8px",
              }}
            >
              {isLoading ? (
                <p style={{ color: "#666", textAlign: "center" }}>
                  Loading messages...
                </p>
              ) : messages.length === 0 ? (
                <p style={{ color: "#666", textAlign: "center" }}>
                  No messages yet.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.sender?.id === user.id ? "flex-end" : "flex-start",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          maxWidth: "70%",
                          padding: "8px 12px",
                          backgroundColor:
                            msg.sender?.id === user.id ? "#3700b3" : "#333",
                          color: "white",
                          borderRadius: "8px",
                          wordWrap: "break-word",
                          marginBottom: "4px",
                        }}
                      >
                        {msg.content}
                      </p>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          display: "block",
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleString()}
                        {msg.sender?.id === user.id && (
                          <span style={{ marginLeft: "8px", color: "#bb86fc" }}>
                            {msg.isRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  backgroundColor: "#1e1e1e",
                  color: "white",
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#3700b3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  opacity: isLoading ? 0.6 : 1,
                }}
                disabled={isLoading || !newMessage.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
