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
      const validMessages = fetchedMessages.filter(
        (msg) => msg && msg.id && msg.sender?.id && msg.content
      );
      setMessages(validMessages);
      await fetchConversations();
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
      <div className="p-10 text-center text-gray-600 font-inter">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 mt-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Messages
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Connect with service providers and clients
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FiMessageSquare className="text-cyan-400" /> Conversations
            </h2>
            {isLoading && !conversations.length ? (
              <p className="text-sm text-gray-600 text-center py-4">
                Loading...
              </p>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex items-center p-3 rounded-md cursor-pointer mb-2 transition-colors ${
                    selectedUserId === conv.id
                      ? "bg-cyan-50"
                      : conv.unreadCount > 0
                      ? "bg-gray-100"
                      : "hover:bg-gray-100"
                  }`}
                  role="button"
                  aria-label={`Select conversation with ${conv.name}`}
                >
                  <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center mr-3 text-cyan-400">
                    <FiUser />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      {conv.name}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-cyan-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <FiChevronRight className="text-gray-600" />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                No conversations yet
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedUserId
                ? `Chat with ${
                    conversations.find((c) => c.id === selectedUserId)?.name ||
                    "Unknown"
                  }`
                : "Select a conversation"}
            </h2>

            {error && (
              <div
                className="p-3 bg-red-100 text-red-700 rounded-md mb-4 text-sm animate-fadeInUp"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {selectedUserId && (
              <>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
                  {isLoading ? (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Loading messages...
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No messages yet
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender?.id === user.id
                            ? "self-end bg-cyan-400 text-gray-900 rounded-br-none"
                            : "self-start bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="block text-xs text-gray-500 mt-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.sender?.id === user.id && (
                            <span className="ml-1 text-cyan-600">
                              {msg.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={isLoading}
                    className="flex-1 p-3 border border-gray-200 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100"
                    aria-label="Type a message"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="px-4 bg-cyan-400 text-gray-900 rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                    aria-label="Send message"
                  >
                    <FiSend />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
