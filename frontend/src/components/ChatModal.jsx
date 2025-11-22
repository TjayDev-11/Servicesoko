import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { BsArrowRight } from "react-icons/bs";
import useStore from "../store";
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

const ChatModal = ({ seller, onClose }) => {
  const { user, token, fetchConversations } = useStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !seller?.id || !token) {
      setError("Please enter a message and ensure you’re logged in");
      return;
    }
    setIsLoading(true);
    try {
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
      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage("");
      setError(null);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-inter">
      <div className="bg-white w-full max-w-md h-[70vh] rounded-lg flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 bg-cyan-400 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {seller?.image ? (
                <img
                  src={seller.image}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-semibold text-base">
                  {seller?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold">
              {seller?.name || "Unknown Seller"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close chat"
          >
            <IoMdClose size={20} />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {isLoading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              Start your conversation
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[70%] p-3 rounded-2xl mb-3 text-sm ${
                  msg.senderId === user?.id
                    ? "bg-cyan-400 text-white ml-auto rounded-br-md"
                    : "bg-gray-200 text-gray-900 mr-auto rounded-bl-md"
                }`}
              >
                {msg.content}
                <span className="block text-xs opacity-70 mt-1 text-right">
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
          <div className="p-2 text-red-500 text-sm bg-red-100 mx-4 rounded-md">
            {error}
          </div>
        )}
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-all"
            aria-label="Type a message"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-cyan-400 text-white rounded-full hover:bg-cyan-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            aria-label="Send message"
          >
            <BsArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
