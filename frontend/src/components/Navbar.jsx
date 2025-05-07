import { Link, useNavigate, useLocation } from "react-router-dom";
import useStore from "../store";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  FaSearch,
  FaUser,
  FaTachometerAlt,
  FaEnvelope,
  FaShoppingBag,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

// Utility to debounce API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function Navbar() {
  const { token, isTokenValid, clear, user, fetchOrders, newOrdersCount } =
    useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cache for API responses
  const dataCache = useRef({
    unreadCount: 0,
    lastFetchedUnread: 0,
    ordersFetched: false,
  });

  // Debounced fetchUnreadCount
  const fetchUnreadCount = useCallback(
    debounce(async (force = false) => {
      const now = Date.now();
      // Skip if recently fetched (within 30 seconds) unless forced
      if (!force && now - dataCache.current.lastFetchedUnread < 30000) {
        setUnreadCount(dataCache.current.unreadCount);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const totalUnread = response.data.conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        dataCache.current.unreadCount = totalUnread;
        dataCache.current.lastFetchedUnread = now;
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Failed to fetch unread count:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setUnreadCount(dataCache.current.unreadCount || 0);
      }
    }, 300),
    [token]
  );

  // Preload data on mount
  useEffect(() => {
    if (token && isTokenValid(token)) {
      // Fetch unread count and orders only if not already fetched
      if (!dataCache.current.lastFetchedUnread) {
        fetchUnreadCount();
      }
      if (!dataCache.current.ordersFetched) {
        fetchOrders(token);
        dataCache.current.ordersFetched = true;
      }
    }
  }, [token, fetchUnreadCount, fetchOrders]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (isDropdownOpen) {
      timeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 5000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [isDropdownOpen]);

  const resetAutoCloseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 5000);
    }
  }, []);

  // Open dropdown without fetching data
  const handleDropdownOpen = useCallback(() => {
    setIsDropdownOpen(true);
    // Use cached data instead of fetching
    setUnreadCount(dataCache.current.unreadCount);
  }, []);

  const handleLogout = useCallback(() => {
    clear();
    navigate("/login");
  }, [clear, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const isAuthenticated = token && isTokenValid(token);

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .nav-link {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            padding: 8px 16px;
            transition: all 0.3s ease;
            font-weight: 500;
            letter-spacing: 0.5px;
            border-radius: 4px;
            margin: 0 4px;
          }
          .nav-link:hover {
            color: white;
            background-color: rgba(79, 195, 247, 0.2);
          }
          .active-nav-link {
            color: white;
            background-color: rgba(79, 195, 247, 0.2);
            border-bottom: 2px solid #4fc3f7;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-img {
            height: 40px;
            width: auto;
            transition: transform 0.3s ease;
          }
          .logo-img:hover {
            transform: scale(1.05);
          }
          .desktop-nav {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .mobile-nav {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: rgba(26, 35, 126, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 16px;
            z-index: 999;
          }
          .mobile-nav-link {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            border-radius: 4px;
          }
          .mobile-nav-link:hover {
            color: white;
            background-color: rgba(79, 195, 247, 0.2);
          }
          .mobile-active-nav-link {
            color: white;
            background-color: rgba(79, 195, 247, 0.2);
            border-left: 3px solid #4fc3f7;
          }
          .hamburger {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
          }
          @media (max-width: 768px) {
            .desktop-nav {
              display: none;
            }
            .hamburger {
              display: block;
            }
            .mobile-nav {
              display: ${isMobileMenuOpen ? "flex" : "none"};
            }
            .logo-img {
              height: 32px;
            }
            .logo-container span {
              font-size: 20px;
            }
            .dropdown-container {
              margin-left: 8px;
            }
            .dropdown-menu {
              min-width: 100%;
              width: calc(100vw - 32px);
              right: 16px;
              left: 16px;
              transform: translateX(0);
            }
          }
          @media (max-width: 480px) {
            nav {
              padding: 12px 16px;
            }
            .logo-container span {
              font-size: 18px;
            }
          }
        `}
      </style>
      <nav
        style={{
          backgroundColor: "rgba(26, 35, 126, 0.95)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "16px 24px",
          border: "none",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <Link
            to="/"
            className="logo-container"
            style={{
              textDecoration: "none",
            }}
          >
            <img
              src="/images/logo.png"
              alt="ServiceSoko Logo"
              className="logo-img"
            />
            <span
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "1px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Service<span style={{ color: "#4fc3f7" }}>Soko</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="desktop-nav">
              <Link
                to="/"
                className={`nav-link ${
                  location.pathname === "/" ? "active-nav-link" : ""
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`nav-link ${
                  location.pathname === "/about" ? "active-nav-link" : ""
                }`}
              >
                About
              </Link>
              <Link
                to="/services"
                className={`nav-link ${
                  location.pathname === "/services" ? "active-nav-link" : ""
                }`}
              >
                Services
              </Link>
              <Link
                to="/contact"
                className={`nav-link ${
                  location.pathname === "/contact" ? "active-nav-link" : ""
                }`}
              >
                Contact
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={`nav-link ${
                    location.pathname === "/login" ? "active-nav-link" : ""
                  }`}
                  style={{
                    background: "#4fc3f7",
                    color: "#0d47a1",
                    padding: "8px 20px",
                    borderRadius: "50px",
                    fontWeight: "600",
                  }}
                >
                  Log in
                </Link>
              )}
            </div>

            <button
              className="hamburger"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {isAuthenticated && (
              <div className="dropdown-container" ref={dropdownRef}>
                <button
                  onClick={handleDropdownOpen}
                  style={{
                    background: "rgba(79, 195, 247, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "16px",
                    cursor: "pointer",
                    padding: "10px 14px",
                    borderRadius: "50%",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="User menu"
                >
                  <FaUser style={{ fontSize: "18px" }} />
                  {(unreadCount > 0 || newOrdersCount > 0) && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        backgroundColor: "#4fc3f7",
                        color: "#0d47a1",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        fontWeight: "bold",
                      }}
                    >
                      {unreadCount + newOrdersCount}
                    </span>
                  )}
                </button>
                {isDropdownOpen && (
                  <div
                    className="dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      backgroundColor: "rgba(26, 35, 126, 0.95)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      minWidth: "250px",
                      zIndex: 1000,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseMove={resetAutoCloseTimer}
                  >
                    <Link
                      to="/profile"
                      style={dropdownLinkStyle()}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaUser
                        style={{ marginRight: "10px", color: "#4fc3f7" }}
                      />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      style={dropdownLinkStyle()}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaTachometerAlt
                        style={{ marginRight: "10px", color: "#4fc3f7" }}
                      />
                      Dashboard
                    </Link>
                    <Link
                      to="/messages"
                      style={dropdownLinkStyle()}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        fetchUnreadCount(true); // Force refresh only when navigating to messages
                      }}
                    >
                      <FaEnvelope
                        style={{ marginRight: "10px", color: "#4fc3f7" }}
                      />
                      Messages
                      {unreadCount > 0 && (
                        <span style={badgeStyle("#4fc3f7")}>{unreadCount}</span>
                      )}
                    </Link>
                    <Link
                      to="/orders"
                      style={dropdownLinkStyle()}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaShoppingBag
                        style={{ marginRight: "10px", color: "#4fc3f7" }}
                      />
                      Orders
                      {newOrdersCount > 0 && (
                        <span
                          style={{
                            marginLeft: "8px",
                            backgroundColor: "#4fc3f7",
                            color: "#0d47a1",
                            borderRadius: "12px",
                            padding: "2px 8px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            animation: "pulse 1.5s infinite",
                          }}
                        >
                          {newOrdersCount} New
                        </span>
                      )}
                    </Link>
                    <div
                      style={{
                        padding: "8px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 16px",
                          background: "none",
                          border: "none",
                          color: "#ff5252",
                          fontWeight: "500",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: "4px",
                          transition: "background-color 0.3s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(255, 82, 82, 0.1)")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        <FaSignOutAlt style={{ marginRight: "10px" }} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mobile-nav">
          <Link
            to="/"
            className={`mobile-nav-link ${
              location.pathname === "/" ? "mobile-active-nav-link" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`mobile-nav-link ${
              location.pathname === "/about" ? "mobile-active-nav-link" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/services"
            className={`mobile-nav-link ${
              location.pathname === "/services" ? "mobile-active-nav-link" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </Link>
          <Link
            to="/contact"
            className={`mobile-nav-link ${
              location.pathname === "/contact" ? "mobile-active-nav-link" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className={`mobile-nav-link ${
                location.pathname === "/login" ? "mobile-active-nav-link" : ""
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                background: "#4fc3f7",
                color: "#0d47a1",
                padding: "12px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

const dropdownLinkStyle = () => ({
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  color: "rgba(255, 255, 255, 0.9)",
  textDecoration: "none",
  fontWeight: "500",
  transition: "all 0.2s ease",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
});

const badgeStyle = (bgColor) => ({
  marginLeft: "auto",
  backgroundColor: bgColor,
  color: "#0d47a1",
  borderRadius: "50%",
  minWidth: "20px",
  height: "20px",
  fontSize: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 4px",
  fontWeight: "bold",
});

export default Navbar;
