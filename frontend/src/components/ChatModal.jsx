import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { BsArrowRight } from "react-icons/bs";
import useStore from "../store";
import api from "../api";

const ChatModal = ({ seller, onClose }) => {
  const { user, token, fetchConversations } = useStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token || !seller?.id) {
        setError("Invalid session or seller data");
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get(`/api/messages/${seller.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched messages:", response.data);
        setMessages(response.data.messages || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching messages:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(
          err.response?.data?.error ||
            "Failed to fetch messages. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [token, seller?.id]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !seller?.id || !token) {
      setError("Please enter a message and ensure you’re logged in");
      return;
    }
    setIsLoading(true);
    try {
      console.log("Sending message:", {
        receiverId: seller.id,
        content: newMessage,
      });
      const response = await api.post(
        "/api/messages",
        {
          receiverId: seller.id,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Sent message:", response.data);
      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage("");
      setError(null);
      // Refresh conversations to update unread count
      await fetchConversations(token);
    } catch (err) {
      console.error("Error sending message:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      let errorMessage = "Failed to send message. Please try again.";
      switch (err.response?.status) {
        case 400:
          errorMessage =
            err.response.data.error || "Invalid message or receiver";
          break;
        case 404:
          errorMessage = err.response.data.error || "Seller not found";
          break;
        case 500:
          errorMessage =
            err.response.data.error || "Server error, please try again later";
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <div className="seller-info">
            <div className="avatar">
              {seller?.image ? (
                <img src={seller.image} alt={seller.name} />
              ) : (
                <div className="initials">
                  {seller?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </div>
              )}
            </div>
            <div>
              <h3>{seller?.name || "Unknown Seller"}</h3>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <IoMdClose />
          </button>
        </div>
        <div className="chat-messages">
          {isLoading && messages.length === 0 ? (
            <div className="empty-chat">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">Start your conversation</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.senderId === user?.id ? "sent" : "received"
                }`}
              >
                {msg.content}
                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
        {error && (
          <div
            className="error-message"
            style={{ color: "red", padding: "8px" }}
          >
            {error}
          </div>
        )}
        <div className="chat-input">
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
            disabled={!newMessage.trim() || isLoading}
          >
            <BsArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;

const styles = `
  .chat-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .chat-modal {
    background: #FFFFFF;
    width: 100%;
    max-width: 480px;
    height: 70vh;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    padding: 12px 16px;
    background: #3B82F6;
    color: #FFFFFF;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .seller-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .initials {
    font-size: 16px;
    font-weight: 600;
    color: #6B7280;
  }

  .chat-header h3 {
    font-size: 16px;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #FFFFFF;
    font-size: 20px;
    cursor: pointer;
  }

  .chat-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background: #F9FAFB;
  }

  .empty-chat {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6B7280;
    font-size: 14px;
  }

  .message {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 16px;
    margin-bottom: 12px;
    font-size: 14px;
  }

  .message.sent {
    background: #3B82F6;
    color: #FFFFFF;
    margin-left: auto;
    border-bottom-right-radius: 4px;
  }

  .message.received {
    background: #E5E7EB;
    color: #2D2D2D;
    margin-right: auto;
    border-bottom-left-radius: 4px;
  }

  .time {
    display: block;
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
    text-align: right;
  }

  .chat-input {
    padding: 12px;
    border-top: 1px solid #E5E7EB;
    display: flex;
    gap: 8px;
  }

  .chat-input input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #E5E7EB;
    border-radius: 20px;
    outline: none;
    font-size: 14px;
  }

  .chat-input button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #3B82F6;
    color: #FFFFFF;
    cursor: pointer;
  }

  .chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
