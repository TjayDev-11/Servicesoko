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
    profilePhoto: null,
  });
  const [servicesList, setServicesList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

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
        profilePhoto: user.profilePhoto || user?.sellerProfile?.profilePhoto || null,
      };
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

      if (form.role !== "buyer" && form.services) {
        formData.append("services", form.services.trim());
      }
      if (form.profilePhoto && typeof form.profilePhoto !== "string") {
        formData.append("profilePhoto", form.profilePhoto);
      }

      await updateProfile(formData);
      setFeedback({ message: "Profile updated successfully!", type: "success" });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({
        message: error.message || "Update failed. Please try again.",
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
        className="max-w-4xl mx-auto bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-sm text-gray-600">Manage your account information</p>
        </div>

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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center lg:-mt-20">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-cyan-400 relative">
              {form.profilePhoto ? (
                <img
                  src={`${
                    typeof form.profilePhoto === "string"
                      ? form.profilePhoto
                      : URL.createObjectURL(form.profilePhoto)
                  }?t=${new Date().getTime()}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
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
                    onChange={(e) =>
                      setForm({ ...form, profilePhoto: e.target.files[0] })
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="mt-4 space-y-3 w-full max-w-xs">
              {isEditing ? (
                <div className="space-y-3">
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
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <FiMail className="text-cyan-400" />
                    <span className="text-sm">{form.email}</span>
                  </div>
                  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <FiMapPin className="text-cyan-400" />
                    <span className="text-sm">
                      {form.location || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <FiPhone className="text-cyan-400" />
                    <span className="text-sm">{form.phone || "Not provided"}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="flex-1">
            <div className="mb-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
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
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <FiUser className="text-cyan-400" />
                    <span className="text-lg font-semibold text-gray-900">
                      {form.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">
                      {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {(form.role === "seller" || form.role === "both") && (
              <div className="mb-6">
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
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
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

            <div className="mt-6">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-cyan-400 text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:opacity-70"
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
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md flex items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 px-4 bg-cyan-400 text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500"
                >
                  <FiEdit /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;