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
  const [tempPhotoUrl, setTempPhotoUrl] = useState(null); // Local state for blob URL
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  const BACKEND_URL = "http://localhost:5000";

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
    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
      cardRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  // Cleanup blob URLs
  useEffect(() => {
    let url;
    if (form.profilePhoto && typeof form.profilePhoto !== "string") {
      url = URL.createObjectURL(form.profilePhoto);
    } else if (form.profilePhoto && typeof form.profilePhoto === "string") {
      url = `${BACKEND_URL}${form.profilePhoto}`; // e.g., http://localhost:5000/Uploads/profiles/1747050809882-191896755.jpeg
      console.log("Image URL set to:", url); // Debug log
    }
    return () => {
      if (url && typeof url === "string") URL.revokeObjectURL(url);
    };
  }, [form.profilePhoto]);

  // Authentication check
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      refreshUser(token);
    }
  }, [token, navigate, refreshUser]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const newForm = {
        name: user.name || "",
        email: user.email || "",
        role: (user.role || "").toLowerCase(),
        location: user.location || user?.sellerProfile?.location || "",
        phone: user.phone || user?.sellerProfile?.phone || "",
        services: user?.sellerProfile?.services?.join(", ") || "",
        bio: user.bio || user?.sellerProfile?.bio || "",
        profilePhoto: user.profilePhoto || user?.sellerProfile?.profilePhoto || null,
      };
      console.log("Updated form with user data:", newForm);
      setForm(newForm);

      const serviceTitles =
        user?.sellerProfile?.serviceSellers?.map((item) => item?.service?.title).filter(Boolean) || [];
      setServicesList(serviceTitles);
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
      console.log("Sending form data:", Object.fromEntries(formData));

      const response = await updateProfile(formData);
      console.log("Update profile response:", response);

      // Force refresh user data to get the updated profile photo
      await refreshUser(token);
      setFeedback({ message: "Profile updated successfully!", type: "success" });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      setFeedback({
        message: error.response?.data?.message || error.message || "Update failed. Please try again.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitial = (name) => (name ? name[0].toUpperCase() : "");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-center p-10">
        <FiLoader className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div
        ref={sectionRef}
        className="max-w-5xl mx-auto bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200"
      >
        {feedback && (
          <div
            className={`p-3 rounded-md mb-4 text-sm flex items-center gap-2 animate-fadeInUp animation-delay-100 ${
              feedback.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span>{feedback.message}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <FiLoader className="animate-spin text-cyan-400 text-xl" />
          </div>
        )}

        <h1 className="text-2xl font-semibold text-gray-900 mb-6 animate-fadeInUp">My Profile</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-cyan-400 relative">
              {form.profilePhoto ? (
                <img
                  src={
                    typeof form.profilePhoto === "string"
                      ? `${BACKEND_URL}${form.profilePhoto}?t=${new Date().getTime()}`
                      : tempPhotoUrl
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load profile photo:", form.profilePhoto);
                    e.target.style.display = "none"; // Hide broken image
                  }}
                />
              ) : (
                <span className="text-5xl font-bold text-gray-900">
                  {getInitial(form.name)}
                </span>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-cyan-400 text-white p-2 rounded-full cursor-pointer hover:bg-cyan-500 transition-all">
                  <FiEdit className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setForm({ ...form, profilePhoto: file });
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm animate-fadeInUp animation-delay-200">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-cyan-400 relative">
                      {form.profilePhoto ? (
                        <img
                          src={
                            typeof form.profilePhoto === "string"
                              ? `${form.profilePhoto}?t=${new Date().getTime()}`
                              : tempPhotoUrl
                          }
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Failed to load profile photo:", form.profilePhoto);
                            e.target.style.display = "none"; // Hide broken image
                          }}
                        />
                      ) : (
                        <span className="text-5xl font-bold text-gray-900">
                          {getInitial(form.name)}
                        </span>
                      )}
                      <label className="absolute bottom-0 right-0 bg-cyan-400 text-white p-2 rounded-full cursor-pointer hover:bg-cyan-500 transition-all">
                        <FiEdit className="text-sm" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            setForm({ ...form, profilePhoto: file });
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  {(form.role === "seller" || form.role === "both") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        rows="3"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  {(form.role === "seller" || form.role === "both") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Services (comma separated)
                      </label>
                      <input
                        type="text"
                        value={form.services}
                        onChange={(e) => setForm({ ...form, services: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 bg-cyan-400 text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:opacity-70 transition-all duration-300"
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
                      className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300"
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Name</span>
                    <span className="text-gray-600">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="text-cyan-400" />
                    <span className="text-gray-600">{form.email}</span>
                  </div>
                  {(form.role === "seller" || form.role === "both") && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Bio</span>
                      <span className="text-gray-600">{form.bio || "Not provided"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-cyan-400" />
                    <span className="text-gray-600">{form.location || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Role</span>
                    <span className="text-gray-600">
                      {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-cyan-400" />
                    <span className="text-gray-600">{form.phone || "Not provided"}</span>
                  </div>
                </div>
              )}
            </div>

            {(form.role === "seller" || form.role === "both") && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-fadeInUp animation-delay-400">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span>Services Offered</span>
                  {servicesList.length === 0 && (
                    <span className="text-xs text-gray-400">(None added yet)</span>
                  )}
                </h3>
                {servicesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {servicesList.map((title, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm transition-all duration-300 hover:bg-gray-200"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    You haven't added any services yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setIsEditing(true)}
              className="py-2 px-6 bg-cyan-400 text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 transition-all duration-300 animate-fadeInUp animation-delay-600"
            >
              <FiEdit /> Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;