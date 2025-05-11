
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import axios from "axios";
import { FaStore, FaUserTie } from "react-icons/fa";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

function BecomeSeller() {
  const { token, user, setToken, refreshUser } = useStore();
  const navigate = useNavigate();

  const initialSellerForm = useMemo(
    () => ({
      name: user?.name || "",
      phone: user?.phone || "",
      location: "",
      gender: "",
      profilePhoto: null,
    }),
    [user]
  );

  const [sellerForm, setSellerForm] = useState(initialSellerForm);
  const [formErrors, setFormErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [snack, setSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const validateSellerForm = () => {
    const errors = {};
    if (!sellerForm.name.trim()) errors.name = "Name is required";
    if (!sellerForm.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\+?\d{10,}$/.test(sellerForm.phone))
      errors.phone = "Invalid phone number";
    if (!sellerForm.location.trim()) errors.location = "Location is required";
    if (!sellerForm.gender) errors.gender = "Gender is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBecomeSeller = async (e) => {
    e.preventDefault();
    if (!validateSellerForm()) {
      setSnack({
        show: true,
        message: "Please fix the errors in the form",
        type: "error",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        1000
      );
      return;
    }

    try {
      setLocalLoading(true);
      const formData = new FormData();
      Object.entries(sellerForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await api.post("/api/become-seller", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;

      if (data.accessToken) {
        await setToken(
          data.accessToken,
          data.user,
          localStorage.getItem("refreshToken")
        );
      }

      await refreshUser(data.accessToken || token);
      setSnack({
        show: true,
        message: "You are now a seller! Start adding your services.",
        type: "success",
      });
      setTimeout(() => {
        setSnack({ show: false, message: "", type: "info" });
        navigate("/add-service");
      }, 1500);
    } catch (error) {
      console.error("Become seller error:", error);
      setSnack({
        show: true,
        message: error.response?.data?.error || "Failed to become a seller",
        type: "error",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        2000
      );
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-2xl mx-auto">
        {snack.show && (
          <div
            className={`fixed top-4 right-4 max-w-sm p-3 rounded-md text-sm flex items-center gap-2 animate-fadeInUp z-50 ${
              snack.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {snack.type === "success" ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {snack.message}
            <button
              onClick={() => setSnack({ show: false, message: "", type: "info" })}
              className="ml-auto text-sm font-medium hover:underline"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        )}

        <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-fadeInUp">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <FaUserTie className="text-cyan-400" /> Become a Seller
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Start offering your services and earn money by joining our professional
            community.
          </p>
          <form onSubmit={handleBecomeSeller}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={sellerForm.name}
                onChange={(e) =>
                  setSellerForm({ ...sellerForm, name: e.target.value })
                }
                className={`w-full px-4 py-2 border ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                } rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-colors`}
                required
                aria-label="Full name"
                aria-describedby={formErrors.name ? "name-error" : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-red-500 text-xs mt-1">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={sellerForm.phone}
                  onChange={(e) =>
                    setSellerForm({ ...sellerForm, phone: e.target.value })
                  }
                  className={`w-full px-4 py-2 border ${
                    formErrors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-colors`}
                  required
                  aria-label="Phone number"
                  aria-describedby={formErrors.phone ? "phone-error" : undefined}
                />
                {formErrors.phone && (
                  <p id="phone-error" className="text-red-500 text-xs mt-1">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={sellerForm.location}
                  onChange={(e) =>
                    setSellerForm({ ...sellerForm, location: e.target.value })
                  }
                  className={`w-full px-4 py-2 border ${
                    formErrors.location ? "border-red-500" : "border-gray-300"
                  } rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-colors`}
                  required
                  aria-label="Location"
                  aria-describedby={
                    formErrors.location ? "location-error" : undefined
                  }
                />
                {formErrors.location && (
                  <p id="location-error" className="text-red-500 text-xs mt-1">
                    {formErrors.location}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  value={sellerForm.gender}
                  onChange={(e) =>
                    setSellerForm({ ...sellerForm, gender: e.target.value })
                  }
                  className={`w-full px-4 py-2 border ${
                    formErrors.gender ? "border-red-500" : "border-gray-300"
                  } rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-colors`}
                  required
                  aria-label="Gender"
                  aria-describedby={formErrors.gender ? "gender-error" : undefined}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.gender && (
                  <p id="gender-error" className="text-red-500 text-xs mt-1">
                    {formErrors.gender}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="profilePhoto"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profile Photo
                </label>
                <input
                  id="profilePhoto"
                  type="file"
                  onChange={(e) =>
                    setSellerForm({
                      ...sellerForm,
                      profilePhoto: e.target.files[0],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-gray-100 transition-colors"
                  aria-label="Profile photo"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                disabled={localLoading}
                aria-label="Submit seller application"
              >
                {localLoading ? "Processing..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 hover:shadow-md transition-colors"
                aria-label="Cancel seller registration"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default BecomeSeller;
