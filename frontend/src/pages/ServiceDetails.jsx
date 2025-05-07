import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import useStore from "../store";
import axios from "axios";
import {
  FaStar,
  FaRegStar,
  FaArrowLeft,
  FaSearch,
  FaCheck,
} from "react-icons/fa";
import { BsChatLeftText, BsArrowRight } from "react-icons/bs";
import BookingModal from "../components/BookingModal";
import ChatModal from "../components/ChatModal";

// Service categories for Kenyan context
const SERVICE_CATEGORIES = [
  {
    id: "plumbing",
    name: "Plumbing",
    image: "/images/plumbing.png",
    description: "Reliable plumbing solutions",
    icon: "🛠️",
    popularServices: ["Leak repairs", "Pipe installation", "Drain cleaning"],
  },
  {
    id: "electrical",
    name: "Electrical",
    image: "/images/electrical.png",
    description: "Certified electrical services",
    icon: "💡",
    popularServices: ["Wiring", "Lighting installation", "Repairs"],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    image: "/images/cleaning.png",
    description: "Professional cleaning services",
    icon: "🧹",
    popularServices: ["House cleaning", "Office cleaning", "Carpet cleaning"],
  },
  {
    id: "moving",
    name: "Moving",
    image: "/images/movers.png",
    description: "Efficient moving services",
    icon: "🚚",
    popularServices: ["Local moving", "Packing", "Furniture transport"],
  },
];

function ServiceDetails() {
  const { category } = useParams();
  const { token, services, user, fetchServices } = useStore();
  const [chatSellerId, setChatSellerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null); // null, "pending", "success", "failed", "needsLogin"
  const navigate = useNavigate();

  // Check if category is undefined or empty
  useEffect(() => {
    if (!category || category.trim() === "") {
      setError("No service category specified. Please select a category.");
      setLoading(false);
    }
  }, [category]);

  const categoryInfo = useMemo(
    () =>
      SERVICE_CATEGORIES.find((cat) => cat.id === category) || {
        name: "Service",
        description: "Professional services",
        image: "/images/default.png",
        popularServices: [],
      },
    [category]
  );

  const categoryServices = useMemo(() => {
    if (!category) return [];
    const targetCategory = category.toLowerCase();
    const filtered = services.filter(
      (service) => service.category?.toLowerCase() === targetCategory
    );

    console.log("Filtered categoryServices:", filtered);
    return filtered;
  }, [services, category]);

  const allSellers = useMemo(() => {
    const sellers = categoryServices.reduce((sellers, service) => {
      if (!service.sellers?.length) return sellers;
      return [
        ...sellers,
        ...service.sellers.map((seller) => ({
          ...seller,
          serviceName: service.title,
          serviceId: service.id,
        })),
      ];
    }, []);
    console.log("All sellers:", sellers); // Debug log
    return sellers;
  }, [categoryServices]);

  const filteredSellers = useMemo(() => {
    const filtered = allSellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("Filtered sellers:", filtered); // Debug log
    return filtered;
  }, [allSellers, searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!category || category.trim() === "") return;

      try {
        setLoading(true);
        setError(null);
        await fetchServices(token);
      } catch (error) {
        setError("Failed to load services. Please try again later.");
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchServices, token, category]);

  const openBookingModal = useCallback((sellerId) => {
    setSelectedSeller(sellerId);
    setShowBookingModal(true);
    setBookingStatus(null);
    setBookingDate(new Date().toISOString().split("T")[0]); // Default to today
    setError(null); // Reset error when opening modal
  }, []);

  const handleBooking = useCallback(async () => {
    if (!user || !user.id) {
      setBookingStatus("needsLogin");
      return;
    }

    const seller = allSellers.find((s) => s.id === selectedSeller);
    if (!seller || !bookingDate) {
      setError("Please select a professional and booking date");
      setBookingStatus("failed");
      return;
    }

    // Validate data before sending
    const serviceId = seller.serviceId; // Keep as string
    const sellerId = seller.id; // Keep as string
    const dateObj = new Date(bookingDate);

    // Validate inputs
    if (!serviceId || typeof serviceId !== "string") {
      console.error("Invalid serviceId:", serviceId);
      setBookingStatus("failed");
      setError("Invalid service ID. Please try another service.");
      return;
    }
    if (!sellerId || typeof sellerId !== "string") {
      console.error("Invalid sellerId:", sellerId);
      setBookingStatus("failed");
      setError("Invalid seller ID. Please try another professional.");
      return;
    }
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid bookingDate:", bookingDate);
      setBookingStatus("failed");
      setError("Invalid booking date. Please select a valid date.");
      return;
    }

    // Ensure booking date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      console.error("Booking date in the past:", bookingDate);
      setBookingStatus("failed");
      setError("Booking date cannot be in the past.");
      return;
    }

    setBookingStatus("pending");

    try {
      const bookingData = {
        serviceId,
        sellerId,
        bookingDate: dateObj.toISOString().split("T")[0], // YYYY-MM-DD format
      };

      console.log("Final booking data:", bookingData);

      const response = await axios.post(
        "${process.env.REACT_APP_API_URL}/api/orders",
        bookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update expected response check based on orderRoutes.js
      if (response.data.message !== "Order placed successfully") {
        throw new Error(response.data.error || "Failed to create order");
      }

      const paymentResponse = await simulateMpesaPayment(
        seller.price,
        user.phone
      );
      if (!paymentResponse.success) throw new Error("Payment failed");

      // Notifications are now handled by the backend, but confirm order details
      console.log(
        `Order confirmed: ${response.data.order.id} for ${seller.serviceName} on ${bookingDate}`
      );

      setBookingStatus("success");
      setTimeout(() => {
        setShowBookingModal(false);
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Booking error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      setBookingStatus("failed");
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to book service. Please try again."
      );
    }
  }, [selectedSeller, allSellers, token, bookingDate, user, navigate]);

  const simulateMpesaPayment = async (amount, phoneNumber) => {
    console.log(
      `Initiating M-Pesa payment of KSh ${amount} to ${
        phoneNumber || "fallback"
      }`
    );
    // Temporarily bypass phoneNumber check for testing
    // if (!phoneNumber) throw new Error("Phone number required for payment");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: "MPESA123456" });
      }, 2000);
    });
  };

  const openChat = useCallback(
    async (sellerId) => {
      setChatSellerId(sellerId);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/messages/${sellerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [token]
  );

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !chatSellerId) return;
    try {
      const response = await axios.post(
        "${process.env.REACT_APP_API_URL}/api/messages",
        { receiverId: chatSellerId, content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...messages, response.data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [newMessage, chatSellerId, token, messages]);

  const renderStars = useCallback((rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span
          key={i}
          style={{
            color: i < rating ? "#FFD700" : "#E0E0E0",
            fontSize: "16px",
            marginRight: "2px",
          }}
        >
          {i < rating ? <FaStar /> : <FaRegStar />}
        </span>
      ));
  }, []);

  return (
    <div className="service-details">
      <div
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${categoryInfo.image})`,
        }}
      >
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <div className="hero-content">
            <h1>{categoryInfo.name}</h1>
            <p>{categoryInfo.description}</p>
          </div>
        </div>
      </div>

      <div className="main-content container">
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search professionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="popular-services">
          <h3>Popular Services</h3>
          <div className="services-grid">
            {categoryInfo.popularServices.map((service, index) => (
              <div key={index} className="service-item">
                <FaCheck /> {service}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredSellers.length > 0 ? (
          <div className="professionals">
            <h2>Professionals</h2>
            <p>{filteredSellers.length} professionals available</p>
            <div className="professionals-grid">
              {filteredSellers.map((seller) => (
                <ProfessionalCard
                  key={seller.id}
                  seller={seller}
                  onChat={() => openChat(seller.id)}
                  renderStars={renderStars}
                  openBookingModal={openBookingModal}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty">No professionals found.</div>
        )}
      </div>

      {chatSellerId && (
        <ChatModal
          seller={allSellers.find((s) => s.id === chatSellerId)}
          messages={messages}
          newMessage={newMessage}
          onClose={() => setChatSellerId(null)}
          onSend={sendMessage}
          onMessageChange={setNewMessage}
          user={user}
        />
      )}

      {showBookingModal && (
        <BookingModal
          seller={allSellers.find((s) => s.id === selectedSeller)}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          onConfirm={handleBooking}
          onClose={() => setShowBookingModal(false)}
          bookingStatus={bookingStatus}
          error={error}
        />
      )}
    </div>
  );
}

const ProfessionalCard = ({
  seller,
  onChat,
  renderStars,
  openBookingModal,
}) => {
  return (
    <div className="pro-card">
      <div className="card-content">
        <div className="avatar">
          {seller.image ? (
            <img src={seller.image} alt={seller.name} />
          ) : (
            <div className="initials">
              {seller.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
        </div>
        <div className="info">
          <h3>{seller.name}</h3>
          <p className="service">{seller.serviceName}</p>
          <div className="details">
            <div className="rating">
              {renderStars(seller.rating || 0)}
              <span>{seller.rating?.toFixed(1) || "New"}</span>
            </div>
          </div>
          <div className="price">From KSh {seller.price}</div>
        </div>
      </div>
      <div className="card-actions">
        <button onClick={() => onChat(seller.id)} className="btn chat-btn">
          <BsChatLeftText /> Chat
        </button>
        <button
          onClick={() => openBookingModal(seller.id)}
          className="btn book-btn"
        >
          Book <BsArrowRight />
        </button>
      </div>
    </div>
  );
};

export default ServiceDetails;

const styles = `
  .service-details {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #2D2D2D;
    line-height: 1.5;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .hero {
    background-size: cover;
    background-position: center;
    color: #FFFFFF;
    padding: 80px 0 120px;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #FFFFFF;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .hero-content {
    margin-top: 32px;
  }

  .hero-content h1 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .hero-content p {
    font-size: 18px;
    opacity: 0.85;
  }

  .main-content {
    transform: translateY(-80px);
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 24px;
    margin-bottom: 40px;
  }

  .search-bar {
    position: relative;
    margin-bottom: 24px;
  }

  .search-bar svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #6B7280;
  }

  .search-bar input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  }

  .popular-services {
    margin-bottom: 32px;
  }

  .popular-services h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .service-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #4B5563;
  }

  .service-item svg {
    color: #10B981;
  }

  .professionals h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .professionals p {
    font-size: 14px;
    color: #6B7280;
    margin-bottom: 16px;
  }

  .professionals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .pro-card {
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 16px;
    transition: border 0.2s, box-shadow 0.2s;
  }

  .card-content {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
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

  .info {
    flex: 1;
  }

  .info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    margin-bottom: 4px;
  }

  .service {
    font-size: 13px;
    color: #6B7280;
    margin: 0;
    margin-bottom: 8px;
  }

  .details {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .rating span {
    font-size: 13px;
    color: #6B7280;
  }

  .price {
    font-size: 14px;
    font-weight: 500;
    color: #2D2D2D;
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .chat-btn {
    background: #3B82F6;
    color: #FFFFFF;
  }

  .chat-btn:hover {
    background: #2563EB;
  }

  .book-btn {
    background: #3B82F6;
    color: #FFFFFF;
  }

  .book-btn:hover {
    background: #2563EB;
  }

  .loading,
  .error,
  .empty {
    text-align: center;
    padding: 32px;
    color: #6B7280;
    font-size: 16px;
  }

  .error {
    color: #EF4444;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
