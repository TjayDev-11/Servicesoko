import { useState, useEffect, useRef } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiEdit,
  FiSave,
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
  FiLoader,
} from "react-icons/fi";
import { FaUserTie, FaStore, FaTools, FaStar, FaStarHalfAlt } from "react-icons/fa";


function Profile() {
  const { user, token, refreshUser } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "buyer",
    location: "",
    phone: "",
    services: "",
    bio: "",
    profilePhoto: null,
  });
  const [servicesList, setServicesList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState(null);
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // Handle profile photo URL
  useEffect(() => {
    if (form.profilePhoto) {
      if (typeof form.profilePhoto === "string") {
        setTempPhotoUrl(`${BACKEND_URL}${form.profilePhoto}`);
      } else if (form.profilePhoto instanceof File) {
        const url = URL.createObjectURL(form.profilePhoto);
        setTempPhotoUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setTempPhotoUrl(null);
    }
  }, [form.profilePhoto]);

  // Log form state changes
  useEffect(() => {
    console.log("Current form state:", JSON.stringify(form, null, 2));
  }, [form]);

  // Authentication check and data loading
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      refreshUser(token).then(() => {
        const updatedUser = useStore.getState().user;
        if (updatedUser) {
          updateFormData(updatedUser);
        }
      });
    }
  }, [token, navigate, refreshUser]);

  const updateFormData = (userData) => {
    const seller = userData?.sellerProfile || {};
    const newForm = {
      name: userData.name || form.name || "",
      email: userData.email || form.email || "",
      role: (userData.role || form.role || "buyer").toLowerCase(),
      location: userData.location || seller.location || form.location || "",
      phone: userData.phone || seller.phone || form.phone || "",
      bio: userData.bio || seller.bio || form.bio || "",
      services: Array.isArray(seller.services)
        ? seller.services.join(", ")
        : form.services || "",
      profilePhoto:
        userData.profilePhoto || seller.profilePhoto || form.profilePhoto || null,
    };
    const serviceTitles = Array.isArray(seller.services) ? seller.services : [];
    console.log("updateFormData - userData:", JSON.stringify(userData, null, 2));
    console.log("updateFormData - newForm:", JSON.stringify(newForm, null, 2));
    console.log("updateFormData - serviceTitles:", serviceTitles);
    setForm(newForm);
    setServicesList(serviceTitles);
  };

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      updateFormData(user);
      setIsLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { updateProfile } = useStore.getState();
    setIsLoading(true);

    if (!form.name.trim() || !form.email.trim()) {
      setFeedback({ message: "Name and email are required", type: "error" });
      setTimeout(() => setFeedback(null), 3000);
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFeedback({ message: "Invalid email format", type: "error" });
      setTimeout(() => setFeedback(null), 3000);
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("location", form.location.trim());
      formData.append("bio", form.bio.trim());

      if (form.role !== "buyer" && form.services) {
        formData.append("services", form.services.trim());
      }
      if (form.profilePhoto && typeof form.profilePhoto !== "string") {
        formData.append("profilePhoto", form.profilePhoto);
      }

      console.log(
        "Submitting profile update with formData:",
        Object.fromEntries(formData)
      );

      await updateProfile(formData);
      await refreshUser(token);
      setFeedback({ message: "Profile updated successfully!", type: "success" });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setFeedback({
        message:
          error.response?.data?.message ||
          error.message ||
          "Update failed. Please try again.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitial = (name) => (name ? name[0].toUpperCase() : "");

  // Calculate average rating and star display
  const getAverageRating = () => {
    const ratings = user?.sellerProfile?.ratings || [];
    if (ratings.length === 0) return { average: null, stars: [] };
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const roundedAverage = Number(average.toFixed(1));
    const fullStars = Math.floor(roundedAverage);
    const hasHalfStar = roundedAverage % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [
      ...Array(fullStars).fill("full"),
      ...(hasHalfStar ? ["half"] : []),
      ...Array(emptyStars).fill("empty"),
    ];
    return { average: roundedAverage, stars };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-center p-10">
        <FiLoader className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  const { average: avgRating, stars: ratingStars } = getAverageRating();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-5">
                My Profile
              </h1>
              <p className="text-sm text-gray-600 mt-3">
                {form.role === "both"
                  ? "Buyer & Seller Account"
                  : form.role
                  ? `${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Account`
                  : "Account"}
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors text-sm mt-5"
              >
                <FiEdit /> Edit Profile
              </button>
            )}
          </div>
        </header>

        {feedback && (
          <div
            className={`fixed top-4 right-4 max-w-sm p-3 rounded-md text-sm flex items-center gap-2 animate-fadeInUp z-50 ${
              feedback.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}
            <button
              onClick={() => setFeedback(null)}
              className="ml-auto text-sm font-medium hover:underline"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 lg:col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-cyan-400 relative mb-4">
                {form.profilePhoto ? (
                  <img
                    src={tempPhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-5xl font-bold text-gray-900">
                    {getInitial(form.name)}
                  </span>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-cyan-400 text-white p-2 rounded-full cursor-pointer hover:bg-cyan-500 transition-all shadow-md">
                    <FiEdit className="text-sm" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setForm({ ...form, profilePhoto: file });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-900 text-center">
                {form.name}
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">{form.email}</p>

              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <div className="p-2 bg-cyan-100 text-cyan-600 rounded-full">
                    {form.role === "seller" || form.role === "both" ? (
                      <FaUserTie className="text-lg" />
                    ) : (
                      <FiUser className="text-lg" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900">
                      {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                    </p>
                  </div>
                </div>

                {(form.role === "seller" || form.role === "both") && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="p-2 bg-cyan-100 text-cyan-600 rounded-full">
                      <FaStar className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Average Rating</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        {ratingStars.length > 0 ? (
                          <>
                            {ratingStars.map((star, idx) => (
                              <span key={idx}>
                                {star === "full" && (
                                  <FaStar className="text-cyan-600" />
                                )}
                                {star === "half" && (
                                  <FaStarHalfAlt className="text-cyan-600" />
                                )}
                                {star === "empty" && (
                                  <FaStar className="text-gray-300" />
                                )}
                              </span>
                            ))}
                            <span className="ml-2">({avgRating} / 5)</span>
                          </>
                        ) : (
                          "No ratings yet"
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <div className="p-2 bg-cyan-100 text-cyan-600 rounded-full">
                    <FiMapPin className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {form.location || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <div className="p-2 bg-cyan-100 text-cyan-600 rounded-full">
                    <FiPhone className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {form.phone || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 lg:col-span-2">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {(form.role === "seller" || form.role === "both") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        rows="3"
                        placeholder="Tell us about yourself and your services..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Services (comma separated)
                      </label>
                      <input
                        type="text"
                        value={form.services}
                        onChange={(e) => setForm({ ...form, services: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        placeholder="Electrical, Wiring..."
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:opacity-70 transition-colors"
                  >
                    {isLoading ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <>
                        <FiSave /> Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {(form.role === "seller" || form.role === "both") && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                      <FaTools className="text-cyan-400" /> About Me
                    </h3>
                    <p className="text-gray-600">
                      {form.bio || "No bio provided yet."}
                    </p>
                  </div>
                )}

                {(form.role === "seller" || form.role === "both") && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                      <FaStore className="text-cyan-400" /> Services Offered
                    </h3>
                    {servicesList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {servicesList.map((title, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No services added yet.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;