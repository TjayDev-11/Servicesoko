
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import useStore from "../store";
import axios from "axios";
import { FaStar, FaRegStar, FaArrowLeft, FaSearch, FaCheck } from "react-icons/fa";
import { BsChatLeftText, BsArrowRight } from "react-icons/bs";
import BookingModal from "../components/BookingModal";
import ChatModal from "../components/ChatModal";
import serviceCategories from "../data/services.js";

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
  const [bookingStatus, setBookingStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!category) {
      setError("No service category specified.");
      setLoading(false);
    }
  }, [category]);

  const categoryInfo = useMemo(
    () =>
      serviceCategories.find((cat) => cat.id === category) || {
        name: "Service",
        description: "Professional services",
        image: "/images/default.png",
        sampleServices: [],
      },
    [category]
  );

  const categoryServices = useMemo(() => {
    if (!category) return [];
    return services.filter(
      (service) => service.category?.toLowerCase() === category.toLowerCase()
    );
  }, [services, category]);

  const allSellers = useMemo(() => {
    return categoryServices.reduce((sellers, service) => {
      if (!service.sellers?.length) return sellers;
      return [
        ...sellers,
        ...service.sellers.map((seller) => ({
          ...seller,
          serviceName: service.title,
          serviceId: service.id,
          // Mock bio for now; replace with actual data from backend
          bio:
            seller.bio ||
            `Specializing in ${service.title.toLowerCase()} with years of experience.`,
        })),
      ];
    }, []);
  }, [categoryServices]);

  const filteredSellers = useMemo(() => {
    return allSellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSellers, searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!category) return;
      try {
        setLoading(true);
        setError(null);
        await fetchServices(token);
      } catch (error) {
        setError("Failed to load services.");
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
    setBookingDate(new Date().toISOString().split("T")[0]);
    setError(null);
  }, []);

  const handleBooking = useCallback(async () => {
    if (!user || !user.id) {
      setBookingStatus("needsLogin");
      return;
    }

    const seller = allSellers.find((s) => s.id === selectedSeller);
    if (!seller || !bookingDate) {
      setError("Select a professional and date.");
      setBookingStatus("failed");
      return;
    }

    const serviceId = seller.serviceId;
    const sellerId = seller.id;
    const dateObj = new Date(bookingDate);

    if (!serviceId || typeof serviceId !== "string") {
      setError("Invalid service ID.");
      setBookingStatus("failed");
      return;
    }
    if (!sellerId || typeof sellerId !== "string") {
      setError("Invalid seller ID.");
      setBookingStatus("failed");
      return;
    }
    if (isNaN(dateObj.getTime()) || dateObj < new Date().setHours(0, 0, 0, 0)) {
      setError("Invalid or past booking date.");
      setBookingStatus("failed");
      return;
    }

    setBookingStatus("pending");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          serviceId,
          sellerId,
          bookingDate: dateObj.toISOString().split("T")[0],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.message !== "Order placed successfully") {
        throw new Error(response.data.error || "Failed to create order");
      }

      const paymentResponse = await simulateMpesaPayment(seller.price, user.phone);
      if (!paymentResponse.success) throw new Error("Payment failed");

      setBookingStatus("success");
      setTimeout(() => {
        setShowBookingModal(false);
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to book service.");
      setBookingStatus("failed");
    }
  }, [selectedSeller, allSellers, token, bookingDate, user, navigate]);

  const simulateMpesaPayment = async (amount) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, transactionId: "MPESA123456" }), 2000);
    });
  };

  const openChat = useCallback(
    async (sellerId) => {
      setChatSellerId(sellerId);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/messages/${sellerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
        `${import.meta.env.VITE_API_URL}/api/messages`,
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
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
          {i < rating ? <FaStar /> : <FaRegStar />}
        </span>
      ));
  }, []);

  return (
    <div className="font-inter text-gray-900 min-h-screen">
      <div
        className="bg-cover bg-center text-white py-20 px-4"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${categoryInfo.image})`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/25 transition-colors"
          >
            <FaArrowLeft /> Back
          </button>
          <div className="mt-8">
            <h1 className="text-4xl font-bold mb-3">{categoryInfo.name}</h1>
            <p className="text-lg opacity-85">{categoryInfo.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto -mt-20 bg-white rounded-2xl shadow-lg p-6 mb-10">
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search professionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Popular Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryInfo.sampleServices.map((service, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <FaCheck className="text-green-500" /> {service}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : filteredSellers.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Professionals</h2>
            <p className="text-sm text-gray-500 mb-4">
              {filteredSellers.length} professionals available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="text-center py-8 text-gray-500">No professionals found.</div>
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

const ProfessionalCard = ({ seller, onChat, renderStars, openBookingModal }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {seller.image ? (
            <img src={seller.image} alt={seller.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 font-semibold text-sm">
              {seller.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold mb-1">{seller.name}</h3>
          <p className="text-xs text-gray-500 mb-2">{seller.serviceName}</p>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{seller.bio}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars(seller.rating || 0)}</div>
            <span className="text-xs text-gray-500">
              {seller.rating?.toFixed(1) || "New"}
            </span>
          </div>
          <div className="text-sm font-medium">From KSh {seller.price}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChat(seller.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          <BsChatLeftText /> Chat
        </button>
        <button
          onClick={() => openBookingModal(seller.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          Book <BsArrowRight />
        </button>
      </div>
    </div>
  );
};

export default ServiceDetails;
