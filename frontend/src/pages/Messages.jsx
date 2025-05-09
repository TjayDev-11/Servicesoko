import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMessageSquare,
  FiSend,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";

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
        `${import.meta.env.VITE_API_URL}/api/conversations`,
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
        `${import.meta.env.VITE_API_URL}/api/messages/${receiverId}`,
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
        `${import.meta.env.VITE_API_URL}/api/messages`,
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
    <div className="messages-container">
      <div className="messages-content">
        <div className="messages-header">
          <h1>Messages</h1>
          <p>Connect with service providers and clients</p>
        </div>

        <div className="messages-layout">
          <div className="conversations-sidebar">
            <h2>
              <FiMessageSquare /> Conversations
            </h2>
            {isLoading && !conversations.length ? (
              <p className="empty-state">Loading...</p>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`conversation-item ${
                    selectedUserId === conv.id ? "active" : ""
                  } ${conv.unreadCount > 0 ? "unread" : ""}`}
                >
                  <div className="conversation-avatar">
                    <FiUser />
                  </div>
                  <div className="conversation-details">
                    <span className="conversation-name">{conv.name}</span>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <FiChevronRight className="chevron-icon" />
                </div>
              ))
            ) : (
              <p className="empty-state">No conversations yet</p>
            )}
          </div>

          <div className="chat-container">
            <h2>
              {selectedUserId
                ? `Chat with ${
                    conversations.find((c) => c.id === selectedUserId)?.name ||
                    "Unknown"
                  }`
                : "Select a conversation"}
            </h2>

            {error && <div className="error-message">{error}</div>}

            {selectedUserId && (
              <>
                <div className="messages-list">
                  {isLoading ? (
                    <p className="empty-state">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="empty-state">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-bubble ${
                          msg.sender?.id === user.id ? "sent" : "received"
                        }`}
                      >
                        <div className="message-content">
                          <p>{msg.content}</p>
                          <span className="message-meta">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {msg.sender?.id === user.id && (
                              <span className="read-status">
                                {msg.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim()}
                  >
                    <FiSend />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .messages-container {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 2rem 1rem;
        }

        .messages-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .messages-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .messages-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a237e;
          margin-bottom: 0.5rem;
        }

        .messages-header p {
          font-size: 1rem;
          color: #666;
        }

        .messages-layout {
          display: flex;
          gap: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .conversations-sidebar {
          width: 300px;
          border-right: 1px solid #eee;
          padding: 1.5rem;
        }

        .conversations-sidebar h2 {
          font-size: 1.25rem;
          color: #1a237e;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }

        .conversation-item:hover {
          background-color: #f5f5f5;
        }

        .conversation-item.active {
          background-color: #e8f4f8;
        }

        .conversation-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #e3f2fd;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
          color: #1a237e;
        }

        .conversation-details {
          flex: 1;
        }

        .conversation-name {
          font-weight: 500;
          color: #333;
        }

        .unread-badge {
          background-color: #4fc3f7;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 0.5rem;
        }

        .chevron-icon {
          color: #999;
        }

        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }

        .chat-container h2 {
          font-size: 1.25rem;
          color: #1a237e;
          margin-bottom: 1.5rem;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .message-bubble {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
        }

        .message-bubble.sent {
          align-self: flex-end;
          background-color: #1a237e;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.received {
          align-self: flex-start;
          background-color: #e3f2fd;
          color: #333;
          border-bottom-left-radius: 4px;
        }

        .message-content p {
          margin: 0;
          word-break: break-word;
        }

        .message-meta {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          display: block;
          text-align: right;
          margin-top: 0.25rem;
        }

        .message-bubble.received .message-meta {
          color: #666;
        }

        .read-status {
          margin-left: 0.25rem;
          color: #4fc3f7;
        }

        .message-input-container {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .message-input-container input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          outline: none;
        }

        .message-input-container button {
          padding: 0 1.25rem;
          background-color: #1a237e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
        }

        .message-input-container button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 0.75rem 1rem;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .empty-state {
          color: #666;
          text-align: center;
          padding: 1rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .messages-layout {
            flex-direction: column;
          }

          .conversations-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #eee;
          }
        }
      `}</style>
    </div>
  );
}

export default Messages;
