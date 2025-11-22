import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaComment,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaPhoneAlt,
} from "react-icons/fa";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [feedback, setFeedback] = useState(null);
  const sectionRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFeedback({
        message: "Please fill all fields",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFeedback({
        message: "Please enter a valid email address",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contact-us`,
        form,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.error || "Failed to send message");
      }

      setFeedback({ message: "Message sent successfully!", type: "success" });
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Submission error:", error);
      setFeedback({
        message:
          error.response?.data?.error ||
          "Failed to send message. Please try again later.",
        type: "error",
      });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div
        ref={sectionRef}
        className="w-full max-w-2xl bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200 opacity-0"
      >
        <div className="text-center mb-8 animate-fadeInUp">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Have questions or need support? Reach out to our team!
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md mb-6 animate-fadeInUp animation-delay-100 ${
              feedback.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationCircle />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                aria-label="Your name"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                aria-label="Your email"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-1">
              Message
            </label>
            <div className="relative">
              <FaComment className="absolute left-3 top-3 text-gray-400" />
              <textarea
                placeholder="Your message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows="5"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm resize-vertical min-h-[120px] focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                aria-label="Your message"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-400 text-gray-900 font-medium rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 hover:shadow-md transition-all"
          >
            <FaPaperPlane />
            Send Message
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-center gap-6 sm:gap-10 animate-fadeInUp animation-delay-200">
          <div className="text-center">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FaEnvelope className="text-cyan-400 text-lg" />
            </div>
            <p className="text-gray-700 font-medium text-sm">Email</p>
            <p className="text-gray-600 text-sm">support@servicesoko.com</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FaPhoneAlt className="text-cyan-400 text-lg" />
            </div>
            <p className="text-gray-700 font-medium text-sm">Phone</p>
            <p className="text-gray-600 text-sm">+254 710 556 990</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
