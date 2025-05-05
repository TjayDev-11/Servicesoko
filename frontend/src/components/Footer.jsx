import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#121212",
        color: "rgba(255, 255, 255, 0.8)",
        padding: "60px 20px 30px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          marginBottom: "40px",
        }}
      >
        {/* Company Info */}
        <div>
          <h3
            style={{
              color: "white",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            Service<span style={{ color: "#4fc3f7" }}>Soko</span>
          </h3>
          <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>
            Connecting skilled professionals with customers across Kenya. Your
            trusted marketplace for quality services.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="#" style={{ color: "white", fontSize: "20px" }}>
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" style={{ color: "white", fontSize: "20px" }}>
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" style={{ color: "white", fontSize: "20px" }}>
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" style={{ color: "white", fontSize: "20px" }}>
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            Quick Links
          </h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/about"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                About Us
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/services"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Services
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/blog"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Blog
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/careers"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Careers
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Popular Services */}
        <div>
          <h4
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            Popular Services
          </h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/services/plumbing"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Plumbing
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/services/electrical"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Electrical
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/services/cleaning"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Cleaning
              </Link>
            </li>
            <li style={{ marginBottom: "12px" }}>
              <Link
                to="/services/moving"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Moving & Packing
              </Link>
            </li>
            <li>
              <Link
                to="/services/beauty"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  ":hover": {
                    color: "#4fc3f7",
                  },
                }}
              >
                Beauty Services
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            Contact Us
          </h4>
          <address style={{ fontStyle: "normal", lineHeight: "1.6" }}>
            <div style={{ marginBottom: "12px" }}>
              <i
                className="fas fa-map-marker-alt"
                style={{ marginRight: "10px", color: "#4fc3f7" }}
              ></i>
              Nairobi, Kenya
            </div>
            <div style={{ marginBottom: "12px" }}>
              <i
                className="fas fa-phone-alt"
                style={{ marginRight: "10px", color: "#4fc3f7" }}
              ></i>
              +254 700 123 456
            </div>
            <div style={{ marginBottom: "12px" }}>
              <i
                className="fas fa-envelope"
                style={{ marginRight: "10px", color: "#4fc3f7" }}
              ></i>
              hello@servicesoko.co.ke
            </div>
            <div>
              <i
                className="fas fa-clock"
                style={{ marginRight: "10px", color: "#4fc3f7" }}
              ></i>
              Mon-Fri: 8AM - 6PM
            </div>
          </address>
        </div>

        {/* Newsletter */}
        <div>
          <h4
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            Newsletter
          </h4>
          <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            Subscribe to get updates on new services and promotions
          </p>
          <div style={{ display: "flex" }}>
            <input
              type="email"
              placeholder="Your email"
              style={{
                padding: "12px",
                border: "none",
                borderRadius: "4px 0 0 4px",
                flex: 1,
                fontSize: "14px",
              }}
            />
            <button
              style={{
                padding: "12px 16px",
                backgroundColor: "#4fc3f7",
                color: "#121212",
                border: "none",
                borderRadius: "0 4px 4px 0",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                ":hover": {
                  backgroundColor: "#3fb3e6",
                },
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "30px",
          textAlign: "center",
          fontSize: "14px",
          color: "rgba(255, 255, 255, 0.6)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Link
            to="/terms"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              margin: "0 12px",
              transition: "color 0.3s ease",
              ":hover": {
                color: "#4fc3f7",
              },
            }}
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              margin: "0 12px",
              transition: "color 0.3s ease",
              ":hover": {
                color: "#4fc3f7",
              },
            }}
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookies"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              margin: "0 12px",
              transition: "color 0.3s ease",
              ":hover": {
                color: "#4fc3f7",
              },
            }}
          >
            Cookie Policy
          </Link>
        </div>
        <p>© {new Date().getFullYear()} ServiceSoko. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
