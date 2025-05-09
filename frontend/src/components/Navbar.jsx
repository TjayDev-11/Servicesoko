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
  FaChevronDown,
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
  const { token, isAuthenticated, clear, user, fetchOrders, sellerOrders } =
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

  // Compute newOrdersCount from sellerOrders
  const newOrdersCount = sellerOrders?.newOrders?.length || 0;

  // Debounced fetchUnreadCount
  const fetchUnreadCount = useCallback(
    debounce(async (force = false) => {
      const now = Date.now();
      if (!force && now - dataCache.current.lastFetchedUnread < 30000) {
        setUnreadCount(dataCache.current.unreadCount);
        return;
      }

      if (!isAuthenticated || !token) {
        setUnreadCount(0);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/conversations`,
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
        setUnreadCount(dataCache.current.unreadCount || 0);
      }
    }, 300),
    [token, isAuthenticated]
  );

  // Preload data on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      if (!dataCache.current.lastFetchedUnread) {
        fetchUnreadCount();
      }
      if (!dataCache.current.ordersFetched) {
        fetchOrders(token);
        dataCache.current.ordersFetched = true;
      }
    } else {
      setUnreadCount(0);
      dataCache.current.ordersFetched = false;
    }
  }, [isAuthenticated, token, fetchUnreadCount, fetchOrders]);

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

  const handleDropdownOpen = useCallback(() => {
    setIsDropdownOpen(true);
    setUnreadCount(dataCache.current.unreadCount);
  }, []);

  const handleLogout = useCallback(() => {
    clear();
    navigate("/login");
  }, [clear, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <>
      <style>
        {`
          .nav-link {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            padding: 8px 12px;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 15px;
            border-radius: 4px;
          }
          .nav-link:hover {
            color: white;
            background-color: rgba(255, 255, 255, 0.1);
          }
          .active-nav-link {
            color: white;
            font-weight: 600;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-img {
            height: 36px;
            width: auto;
          }
          .desktop-nav {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .mobile-nav {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: rgba(26, 35, 126, 0.98);
            padding: 16px;
            z-index: 999;
          }
          .mobile-nav-link {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .mobile-nav-link:hover {
            color: white;
            background-color: rgba(255, 255, 255, 0.1);
          }
          .mobile-active-nav-link {
            color: white;
            font-weight: 600;
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
          .login-btn {
            background: transparent;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .login-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
          }
          .user-btn {
            background: transparent;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .user-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .notification-badge {
            background-color: #4fc3f7;
            color: #0d47a1;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 4px;
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
            .dropdown-menu {
              width: 100%;
              right: 0;
              left: 0;
            }
          }
        `}
      </style>
      <nav
        style={{
          backgroundColor: "rgba(26, 35, 126, 0.98)",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
            style={{ textDecoration: "none" }}
          >
            <img
              src="/images/logo.png"
              alt="ServiceSoko Logo"
              className="logo-img"
            />
            <span
              style={{
                color: "white",
                fontSize: "22px",
                fontWeight: "600",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Service<span style={{ color: "#4fc3f7" }}>Soko</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                <Link to="/login" className="login-btn">
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
                  className="user-btn"
                  onClick={handleDropdownOpen}
                  aria-label="User menu"
                >
                  <FaUser />
                  <FaChevronDown size={12} />
                  {(unreadCount > 0 || newOrdersCount > 0) && (
                    <span className="notification-badge">
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
                      backgroundColor: "rgba(26, 35, 126, 0.98)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      minWidth: "220px",
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
                        fetchUnreadCount(true);
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
                        <span style={badgeStyle("#4fc3f7")}>
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
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          padding: "10px 16px",
                          background: "none",
                          border: "none",
                          color: "rgba(255, 255, 255, 0.8)",
                          fontWeight: "500",
                          cursor: "pointer",
                          borderRadius: "4px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => (e.target.style.color = "white")}
                        onMouseOut={(e) =>
                          (e.target.style.color = "rgba(255, 255, 255, 0.8)")
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
              className="login-btn"
              style={{ marginTop: "8px", textAlign: "center" }}
              onClick={() => setIsMobileMenuOpen(false)}
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
  fontSize: "14px",
});

const badgeStyle = (bgColor) => ({
  marginLeft: "auto",
  backgroundColor: bgColor,
  color: "#0d47a1",
  borderRadius: "10px",
  padding: "2px 6px",
  fontSize: "11px",
  fontWeight: "600",
});

export default Navbar;
