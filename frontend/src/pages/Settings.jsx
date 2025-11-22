import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import axios from "axios";
import {
  FaLock,
  FaTrashAlt,
  FaBell,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";

function Settings() {
  const { user, token, isLoading } = useStore();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // State for active section
  const [activeSection, setActiveSection] = useState(null);

  // State for Change Password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSnack, setPasswordSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // State for Account Deletion
  const [deleteForm, setDeleteForm] = useState({
    confirmText: "",
    reason: "",
    otherReason: "",
  });
  const [deleteErrors, setDeleteErrors] = useState({});
  const [deleteSnack, setDeleteSnack] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const sectionRef = useRef(null);

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

  // Validate Change Password Form
  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) errors.newPassword = "New password is required";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters";
    if (!/[A-Z]/.test(passwordForm.newPassword)) errors.newPassword = "New password must contain at least one uppercase letter";
    if (!/[a-z]/.test(passwordForm.newPassword)) errors.newPassword = "New password must contain at least one lowercase letter";
    if (!/[0-9]/.test(passwordForm.newPassword)) errors.newPassword = "New password must contain at least one number";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      setPasswordSnack({
        show: true,
        message: "Please fix the errors in the form",
        type: "error",
      });
      setTimeout(() => setPasswordSnack({ show: false, message: "", type: "info" }), 2000);
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/auth/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordSnack({
        show: true,
        message: "Password changed successfully!",
        type: "success",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setPasswordSnack({ show: false, message: "", type: "info" });
        setActiveSection(null); // Return to options view
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to change password. Please try again.";
      const errorCode = error.response?.data?.code;
      let displayMessage = errorMessage;
      if (errorCode === "INVALID_CURRENT_PASSWORD") {
        displayMessage = "Incorrect current password";
      } else if (errorCode === "INVALID_PASSWORD") {
        displayMessage = errorMessage; // Backend provides specific password error
      }
      setPasswordSnack({
        show: true,
        message: displayMessage,
        type: "error",
      });
      setTimeout(() => setPasswordSnack({ show: false, message: "", type: "info" }), 2000);
    }
  };

  // Validate Delete Account Form
  const validateDeleteForm = () => {
    const errors = {};
    if (deleteForm.confirmText !== "DELETE") errors.confirmText = "Please type 'DELETE' to confirm";
    if (!deleteForm.reason) errors.reason = "Please select a reason for deletion";
    if (deleteForm.reason === "other" && !deleteForm.otherReason.trim()) {
      errors.otherReason = "Please specify a reason";
    }
    setDeleteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Account Deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!validateDeleteForm()) {
      setDeleteSnack({
        show: true,
        message: "Please fix the errors in the form",
        type: "error",
      });
      setTimeout(() => setDeleteSnack({ show: false, message: "", type: "info" }), 2000);
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          reason: deleteForm.reason,
          otherReason: deleteForm.reason === "other" ? deleteForm.otherReason : undefined,
        },
      });
      setDeleteSnack({
        show: true,
        message: "Account deleted successfully!",
        type: "success",
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setDeleteSnack({
        show: true,
        message: error.response?.data?.error || "Failed to delete account. Please try again.",
        type: "error",
      });
      setTimeout(() => setDeleteSnack({ show: false, message: "", type: "info" }), 2000);
    }
  };

  // Settings Options Configuration
  const settingsOptions = [
    {
      id: "change-password",
      title: "Change Password",
      description: "Update your account password securely.",
      icon: <FaLock className="text-cyan-500 text-2xl" />,
      active: true,
    },
    {
      id: "delete-account",
      title: "Delete Account",
      description: "Permanently remove your account and data.",
      icon: <FaTrashAlt className="text-red-500 text-2xl" />,
      active: true,
    },
    {
      id: "notification-preferences",
      title: "Notification Preferences",
      description: "Customize how you receive notifications.",
      icon: <FaBell className="text-gray-400 text-2xl" />,
      active: false,
    },
    {
      id: "two-factor-auth",
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account.",
      icon: <FaShieldAlt className="text-gray-400 text-2xl" />,
      active: false,
    },
    {
      id: "privacy-settings",
      title: "Privacy Settings",
      description: "Manage your data sharing and visibility preferences.",
      icon: <FaUserShield className="text-gray-400 text-2xl" />,
      active: false,
    },
  ];

  // Deletion Reasons
  const deletionReasons = [
    { value: "", label: "Select a reason" },
    { value: "not-using", label: "Not using the service" },
    { value: "privacy-concerns", label: "Privacy concerns" },
    { value: "better-alternative", label: "Found a better alternative" },
    { value: "too-expensive", label: "Too expensive" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-8">
      <div
        ref={sectionRef}
        className="w-full max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg border border-gray-200 transition-all duration-500"
      >
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Settings
        </h1>

        {/* Options View */}
        {!activeSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {settingsOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => option.active && setActiveSection(option.id)}
                className={`flex items-start gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 ${
                  option.active ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                }`}
                disabled={!option.active}
                aria-label={option.title}
              >
                <div className="flex-shrink-0">{option.icon}</div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {option.title}
                    {!option.active && (
                      <span className="ml-2 text-xs text-gray-500 font-medium">
                        (Coming Soon)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Change Password Section */}
        {activeSection === "change-password" && (
          <div className="mb-8 animate-slide-in-top">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-cyan-500 hover:text-cyan-600 font-semibold flex items-center gap-2"
              aria-label="Back to settings options"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
            {passwordSnack.show && (
              <div
                className={`p-4 rounded-lg mb-6 text-sm flex items-center gap-3 animate-slide-in-top ${
                  passwordSnack.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
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
                    d={
                      passwordSnack.type === "success"
                        ? "M5 13l4 4L19 7"
                        : "M6 18L18 6M6 6l12 12"
                    }
                  />
                </svg>
                <span className="font-medium">{passwordSnack.message}</span>
                <button
                  onClick={() =>
                    setPasswordSnack({ show: false, message: "", type: "info" })
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
                <p className="text-gray-600 font-medium animate-pulse">Processing...</p>
              </div>
            )}
            {!isLoading && (
              <form onSubmit={handleChangePassword}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border ${
                      passwordErrors.currentPassword
                        ? "border-red-400"
                        : "border-gray-200"
                    } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                    required
                    aria-label="Current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border ${
                      passwordErrors.newPassword ? "border-red-400" : "border-gray-200"
                    } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                    required
                    aria-label="New password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border ${
                      passwordErrors.confirmPassword
                        ? "border-red-400"
                        : "border-gray-200"
                    } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                    required
                    aria-label="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  aria-label="Change password"
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Delete Account Section */}
        {activeSection === "delete-account" && (
          <div className="mb-8 animate-slide-in-top">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-cyan-500 hover:text-cyan-600 font-semibold flex items-center gap-2"
              aria-label="Back to settings options"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Account</h2>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot
              be undone.
            </p>
            {deleteSnack.show && (
              <div
                className={`p-4 rounded-lg mb-6 text-sm flex items-center gap-3 animate-slide-in-top ${
                  deleteSnack.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
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
                    d={
                      deleteSnack.type === "success"
                        ? "M5 13l4 4L19 7"
                        : "M6 18L18 6M6 6l12 12"
                    }
                  />
                </svg>
                <span className="font-medium">{deleteSnack.message}</span>
                <button
                  onClick={() => setDeleteSnack({ show: false, message: "", type: "info" })}
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
                <p className="text-gray-600 font-medium animate-pulse">Processing...</p>
              </div>
            )}
            {!isLoading && (
              <form onSubmit={handleDeleteAccount}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Deletion
                  </label>
                  <select
                    value={deleteForm.reason}
                    onChange={(e) =>
                      setDeleteForm({ ...deleteForm, reason: e.target.value })
                    }
                    className={`w-full px-4 py-3 border ${
                      deleteErrors.reason ? "border-red-400" : "border-gray-200"
                    } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                    required
                    aria-label="Reason for deletion"
                  >
                    {deletionReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  {deleteErrors.reason && (
                    <p className="text-red-500 text-xs mt-1.5">{deleteErrors.reason}</p>
                  )}
                </div>
                {deleteForm.reason === "other" && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Please Specify
                    </label>
                    <textarea
                      value={deleteForm.otherReason}
                      onChange={(e) =>
                        setDeleteForm({ ...deleteForm, otherReason: e.target.value })
                      }
                      placeholder="Enter your reason"
                      className={`w-full px-4 py-3 border ${
                        deleteErrors.otherReason ? "border-red-400" : "border-gray-200"
                      } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                      rows="4"
                      required
                      aria-label="Specify reason for deletion"
                    />
                    {deleteErrors.otherReason && (
                      <p className="text-red-500 text-xs mt-1.5">
                        {deleteErrors.otherReason}
                      </p>
                    )}
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteForm.confirmText}
                    onChange={(e) =>
                      setDeleteForm({ ...deleteForm, confirmText: e.target.value })
                    }
                    className={`w-full px-4 py-3 border ${
                      deleteErrors.confirmText ? "border-red-400" : "border-gray-200"
                    } rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 hover:border-gray-300 transition-all duration-200`}
                    required
                    aria-label="Confirm account deletion"
                  />
                  {deleteErrors.confirmText && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {deleteErrors.confirmText}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  aria-label="Delete account"
                >
                  {isLoading ? "Deleting..." : "Delete Account"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Coming Soon Sections */}
        {["notification-preferences", "two-factor-auth", "privacy-settings"].includes(
          activeSection
        ) && (
          <div className="mb-8 animate-slide-in-top">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-cyan-500 hover:text-cyan-600 font-semibold flex items-center gap-2"
              aria-label="Back to settings options"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {settingsOptions.find((opt) => opt.id === activeSection)?.title}
            </h2>
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600 text-sm font-medium">
                This feature is coming soon! Stay tuned for updates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;