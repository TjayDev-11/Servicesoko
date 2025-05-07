import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile() {
  const { user, token, refreshUser } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "buyer",
    location: "",
    phone: "",
    services: "",
    profilePhoto: null, // New field for photo
  });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "buyer",
        location: user.sellerProfile?.location || "",
        phone: user.sellerProfile?.phone || "",
        services: user.sellerProfile?.services || "",
        profilePhoto: user.sellerProfile?.profilePhoto || null, // Updated to handle photo
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) navigate("/login");
    else if (!user) refreshUser(token);
  }, [token, user, navigate, refreshUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      console.error("No token available for profile update");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("location", form.location);
      formData.append("phone", form.phone);
      formData.append("services", form.services);
      if (form.profilePhoto && typeof form.profilePhoto !== "string") {
        formData.append("profilePhoto", form.profilePhoto);
      }

      const response = await axios.put(
        "${process.env.REACT_APP_API_URL}/api/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        await refreshUser(token);
        setIsEditing(false);
      }
    } catch (error) {
      console.error(
        "Profile update failed:",
        error.response ? error.response.data : error.message
      );
    }
  };

  if (!user)
    return (
      <div
        style={{
          padding: "40px",
          color: "#e0e0e0",
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div
      style={{
        padding: "40px",
        width: "100vw",
        margin: "0 auto",
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "#e0e0e0",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: "#bb86fc",
          marginBottom: "24px",
          borderBottom: "1px solid #333",
          paddingBottom: "8px",
        }}
      >
        My Profile
      </h1>
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #333",
              borderRadius: "4px",
              backgroundColor: "#1e1e1e",
              color: "white",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #333",
              borderRadius: "4px",
              backgroundColor: "#1e1e1e",
              color: "white",
            }}
          />
          <select
            value={form.role}
            disabled
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #333",
              borderRadius: "4px",
              backgroundColor: "#1e1e1e",
              color: "white",
            }}
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="both">Both</option>
          </select>
          {form.role !== "buyer" && (
            <>
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "8px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  backgroundColor: "#1e1e1e",
                  color: "white",
                }}
              />
              <input
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "8px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  backgroundColor: "#1e1e1e",
                  color: "white",
                }}
              />
              <input
                type="text"
                placeholder="Services Offered"
                value={form.services}
                onChange={(e) => setForm({ ...form, services: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "8px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  backgroundColor: "#1e1e1e",
                  color: "white",
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({ ...form, profilePhoto: e.target.files[0] })
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "8px",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  backgroundColor: "#1e1e1e",
                  color: "white",
                }}
              />
            </>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 24px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor: "#3700b3",
              color: "white",
              marginTop: "20px",
            }}
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              width: "100%",
              padding: "12px 24px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor: "#333",
              color: "white",
              marginTop: "10px",
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
            <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
              Name:
            </strong>{" "}
            {form.name}
          </p>
          <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
            <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
              Email:
            </strong>{" "}
            {form.email}
          </p>
          <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
            <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
              Role:
            </strong>{" "}
            {form.role}
          </p>
          {form.role !== "buyer" && (
            <>
              <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
                <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
                  Location:
                </strong>{" "}
                {form.location || "Not specified"}
              </p>
              <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
                <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
                  Phone:
                </strong>{" "}
                {form.phone || "Not provided"}
              </p>
              <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
                <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
                  Services Offered:
                </strong>{" "}
                {form.services || "Not specified"}
              </p>
              {form.profilePhoto && (
                <p style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
                  <strong style={{ color: "#bb86fc", marginRight: "8px" }}>
                    Profile Photo:
                  </strong>{" "}
                  <a
                    href={form.profilePhoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4fc3f7" }}
                  >
                    View Photo
                  </a>
                </p>
              )}
            </>
          )}
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: "100%",
              padding: "12px 24px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor: "#3700b3",
              color: "white",
              marginTop: "20px",
            }}
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

export default Profile;
