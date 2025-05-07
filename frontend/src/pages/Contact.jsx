import { useState } from "react";
import axios from "axios";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [feedback, setFeedback] = useState(null);

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
        `${process.env.REACT_APP_API_URL}/api/contact-us`,
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
    <div
      style={{
        backgroundColor: "#121212",
        minHeight: "calc(100vh - 80px)",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#4fc3f7",
              marginBottom: "12px",
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.7)",
              lineHeight: "1.6",
            }}
          >
            Have questions or need support? Reach out to our team!
          </p>
        </div>

        {feedback && (
          <div
            style={{
              backgroundColor:
                feedback.type === "success"
                  ? "rgba(76, 175, 80, 0.2)"
                  : "rgba(239, 83, 80, 0.2)",
              color: feedback.type === "success" ? "#4caf50" : "#ef5350",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <i
              className={`fas ${
                feedback.type === "success"
                  ? "fa-check-circle"
                  : "fa-exclamation-circle"
              }`}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                color: "rgba(255,255,255,0.9)",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Name
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="fas fa-user"
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "16px",
                  color: "rgba(255,255,255,0.5)",
                }}
              />
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  backgroundColor: "#2d2d2d",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "16px",
                  transition: "all 0.3s ease",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                color: "rgba(255,255,255,0.9)",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="fas fa-envelope"
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "16px",
                  color: "rgba(255,255,255,0.5)",
                }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  backgroundColor: "#2d2d2d",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "16px",
                  transition: "all 0.3s ease",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                display: "block",
                color: "rgba(255,255,255,0.9)",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Message
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="fas fa-comment"
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "16px",
                  color: "rgba(255,255,255,0.5)",
                }}
              />
              <textarea
                placeholder="Your message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows="6"
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  backgroundColor: "#2d2d2d",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "16px",
                  resize: "vertical",
                  minHeight: "150px",
                  transition: "all 0.3s ease",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: "#4fc3f7",
              color: "#121212",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <i className="fas fa-paper-plane" />
            Send Message
          </button>
        </form>

        <div
          style={{
            marginTop: "40px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "rgba(79, 195, 247, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <i
                className="fas fa-envelope"
                style={{ color: "#4fc3f7", fontSize: "20px" }}
              />
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              Email
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>
              support@servicesoko.com
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "rgba(79, 195, 247, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <i
                className="fas fa-phone-alt"
                style={{ color: "#4fc3f7", fontSize: "20px" }}
              />
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              Phone
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>
              +254 710 556 990
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
