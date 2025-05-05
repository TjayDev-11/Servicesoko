// frontend/src/AddService.jsx
import { useState } from "react";
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

  // Categories from Services.jsx
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

  const handleAddService = async (e) => {
    e.preventDefault();
    console.log("Submitting service:", formData); // Debug log
    try {
      await addService(token, formData);
      setSnack({
        show: true,
        message: "Service added successfully!",
        type: "success",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
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
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          padding: "48px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a237e",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          Add New Service
        </h1>

        {snack.show && (
          <div
            style={{
              backgroundColor: snack.type === "success" ? "#d4edda" : "#ffebee",
              color: snack.type === "success" ? "#155724" : "#c62828",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{snack.message}</span>
            <button
              onClick={() => setSnack({ ...snack, show: false })}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Close
            </button>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <div
              style={{
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #1a237e",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {!isLoading && (
          <form onSubmit={handleAddService}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#444",
                }}
              >
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "border-color 0.3s ease",
                }}
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
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#444",
                }}
              >
                Title
              </label>
              <input
                type="text"
                placeholder="Service Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "border-color 0.3s ease",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#444",
                }}
              >
                Description
              </label>
              <textarea
                placeholder="Service Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  minHeight: "100px",
                  resize: "vertical",
                  transition: "border-color 0.3s ease",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#444",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "border-color 0.3s ease",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#444",
                }}
              >
                From KSh
              </label>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "border-color 0.3s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isLoading ? "#cccccc" : "#1a237e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  flex: 1,
                }}
                onMouseOver={(e) =>
                  !isLoading && (e.target.style.backgroundColor = "#283593")
                }
                onMouseOut={(e) =>
                  !isLoading && (e.target.style.backgroundColor = "#1a237e")
                }
              >
                {isLoading ? "Adding..." : "Add Service"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ccc",
                  color: "#444",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  flex: 1,
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#bbb")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#ccc")}
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
