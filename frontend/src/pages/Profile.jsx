import { useState, useEffect } from "react";
import useStore from "../store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiUser,
  FiEdit,
  FiSave,
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
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
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "buyer",
        location: user.location || user.sellerProfile?.location || "", // Use user.location for buyers
        phone: user.sellerProfile?.phone || user.phone || "",
        services: user.sellerProfile?.services || "",
        profilePhoto: user.sellerProfile?.profilePhoto || null,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) navigate("/login");
    else if (!user) refreshUser(token);
  }, [token, user, navigate, refreshUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { updateProfile } = useStore.getState();

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("location", form.location); // Include location for all roles

      if (form.role !== "buyer") {
        formData.append("services", form.services);
        if (form.profilePhoto && typeof form.profilePhoto !== "string") {
          formData.append("profilePhoto", form.profilePhoto);
        }
      }

      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      if (error.response?.status === 401) {
        console.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Profile update failed:", error);
      }
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
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>
                <FiUser /> Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiMail /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select value={form.role} disabled>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <FiMapPin /> Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                <FiPhone /> Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {form.role !== "buyer" && (
              <>
                <div className="form-group">
                  <label>Services Offered</label>
                  <input
                    type="text"
                    value={form.services}
                    onChange={(e) =>
                      setForm({ ...form, services: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Profile Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, profilePhoto: e.target.files[0] })
                    }
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                <FiSave /> Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="secondary-button"
              >
                <FiX /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-info-item">
              <FiUser className="info-icon" />
              <div>
                <span className="info-label">Name</span>
                <span className="info-value">{form.name}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <FiMail className="info-icon" />
              <div>
                <span className="info-label">Email</span>
                <span className="info-value">{form.email}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="info-icon" />
              <div>
                <span className="info-label">Role</span>
                <span className="info-value">{form.role}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <FiMapPin className="info-icon" />
              <div>
                <span className="info-label">Location</span>
                <span className="info-value">
                  {form.location || "Not specified"}
                </span>
              </div>
            </div>

            <div className="profile-info-item">
              <FiPhone className="info-icon" />
              <div>
                <span className="info-label">Phone</span>
                <span className="info-value">
                  {form.phone || "Not provided"}
                </span>
              </div>
            </div>

            {form.role !== "buyer" && form.profilePhoto && (
              <div className="profile-info-item">
                <div className="info-icon" />
                <div>
                  <span className="info-label">Profile Photo</span>
                  <a
                    href={form.profilePhoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="photo-link"
                  >
                    View Photo
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="primary-button edit-button"
            >
              <FiEdit /> Edit Profile
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 2rem 1rem;
        }

        .profile-content {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 2rem;
        }

        .profile-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .profile-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a237e;
          margin-bottom: 0.5rem;
        }

        .profile-header p {
          font-size: 1rem;
          color: #666;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          color: #1a237e;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group input[type="file"] {
          padding: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .primary-button {
          padding: 0.75rem 1.5rem;
          background-color: #1a237e;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .primary-button:hover {
          background-color: #0d1b6b;
        }

        .secondary-button {
          padding: 0.75rem 1.5rem;
          background-color: white;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background-color: #f5f5f5;
        }

        .profile-view {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
        }

        .info-icon {
          color: #1a237e;
          font-size: 1.25rem;
          min-width: 24px;
        }

        .info-label {
          font-size: 0.875rem;
          color: #1a237e;
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .info-value {
          font-size: 1rem;
          color: #333;
        }

        .photo-link {
          color: #4fc3f7;
          text-decoration: none;
        }

        .photo-link:hover {
          text-decoration: underline;
        }

        .edit-button {
          margin-top: 2rem;
          width: 100%;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .profile-content {
            padding: 1.5rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
