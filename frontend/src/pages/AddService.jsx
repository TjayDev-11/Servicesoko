import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";

function AddService() {
  const { addService, token, isLoading } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    experience: "",
    price: "",
  });
  const [snack, setSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [errors, setErrors] = useState({});
  const sectionRef = useRef(null);

  const serviceCategories = [
    { id: "plumbing", name: "Plumbing" },
    { id: "electrical", name: "Electrical" },
    { id: "cleaning", name: "Cleaning" },
    { id: "moving", name: "Moving" },
    { id: "painting", name: "Painting" },
    { id: "gardening", name: "Gardening" },
    { id: "carpentry", name: "Carpentry" },
    { id: "appliance", name: "Appliance Repair" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.price && formData.price < 0)
      newErrors.price = "Price cannot be negative";
    if (formData.experience && formData.experience < 0)
      newErrors.experience = "Experience cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnack({
        show: true,
        message: "Please fix the errors in the form",
        type: "error",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        2000
      );
      return;
    }

    console.log("Submitting service:", formData);
    try {
      await addService(formData);
      setSnack({
        show: true,
        message: "Service added successfully!",
        type: "success",
      });
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      console.error("Add service error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setSnack({
        show: true,
        message:
          error.response?.data?.error ||
          error.message ||
          "Failed to add service. Please try again.",
        type: "error",
      });
      setTimeout(
        () => setSnack({ show: false, message: "", type: "info" }),
        2000
      );
    }
  };

  const handleCancel = () => {
    if (
      formData.category ||
      formData.title ||
      formData.description ||
      formData.experience ||
      formData.price
    ) {
      if (window.confirm("Discard unsaved changes?")) {
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 mt-8">
      <div
        ref={sectionRef}
        className="w-full max-w-lg bg-white rounded-xl p-8 shadow-lg border border-gray-200  transition-all duration-500"
      >
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Add New Service
        </h1>

        {snack.show && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm flex items-center gap-3 animate-slide-in-top ${
              snack.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {snack.type === "success" ? (
              <svg
                className="w-6 h-6 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium">{snack.message}</span>
            <button
              onClick={() =>
                setSnack({ show: false, message: "", type: "info" })
              }
              className="ml-auto text-sm font-semibold hover:underline"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-4 border-cyan-200 border-t-cyan-400 rounded-full animate-spin animate-reverse"></div>
            </div>
            <p className="text-gray-600 font-medium animate-pulse">
              Adding Service...
            </p>
          </div>
        )}

        {!isLoading && (
          <form onSubmit={handleAddService}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-3 border ${
                  errors.category ? "border-red-400" : "border-gray-200"
                } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                required
                aria-label="Service category"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1.5">{errors.category}</p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder="Service Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={`w-full px-4 py-3 border ${
                  errors.title ? "border-red-400" : "border-gray-200"
                } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                required
                aria-label="Service title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Service Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`w-full px-4 py-3 border ${
                  errors.description ? "border-red-400" : "border-gray-200"
                } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200 resize-vertical min-h-[120px]`}
                required
                aria-label="Service description"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience (years)
              </label>
              <input
                type="number"
                placeholder="Years of Experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
                min="0"
                step="1"
                className={`w-full px-4 py-3 border ${
                  errors.experience ? "border-red-400" : "border-gray-200"
                } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                aria-label="Years of experience"
              />
              {errors.experience && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.experience}
                </p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From KSh
              </label>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border ${
                  errors.price ? "border-red-400" : "border-gray-200"
                } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                required
                aria-label="Service price"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1.5">{errors.price}</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                aria-label="Add service"
              >
                {isLoading ? "Adding..." : "Add Service"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddService;
