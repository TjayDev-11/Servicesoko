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
  FaCog, // Added for Settings icon
} from "react-icons/fa";

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
  const mobileMenuRef = useRef(null);

  const dataCache = useRef({
    unreadCount: 0,
    lastFetchedUnread: 0,
    ordersFetched: false,
  });

  const newOrdersCount = sellerOrders?.newOrders?.length || 0;

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
        const totalUnread =
          response.data.conversations?.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          ) || 0;
        dataCache.current.unreadCount = totalUnread;
        dataCache.current.lastFetchedUnread = now;
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Error fetching unread count:", error);
        setUnreadCount(dataCache.current.unreadCount || 0);
      }
    }, 300),
    [token, isAuthenticated]
  );

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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    clear();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/login");
  }, [clear, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDropdownOpen(false);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 py-3 px-4 sm:px-6 lg:px-8 font-manrope bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="ServiceSoko Logo"
              className="h-7 sm:h-8"
              onError={(e) => (e.target.src = "/images/fallback-logo.png")}
            />
            <span className="text-gray-900 text-lg sm:text-xl font-semibold">
              Service<span className="text-cyan-400">Soko</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-2">
              <li>
                <Link
                  to="/"
                  className={`px-2 py-1 text-gray-900 text-sm font-medium hover:text-cyan-400 rounded-md transition-colors font-custom ${
                    location.pathname === "/" ? "text-cyan-400" : ""
                  }`}
                  aria-current={location.pathname === "/" ? "page" : undefined}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className={`px-2 py-1 text-gray-900 text-sm font-medium hover:text-cyan-400 rounded-md transition-colors font-custom ${
                    location.pathname === "/about" ? "text-cyan-400" : ""
                  }`}
                  aria-current={
                    location.pathname === "/about" ? "page" : undefined
                  }
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className={`px-2 py-1 text-gray-900 text-sm font-medium hover:text-cyan-400 rounded-md transition-colors font-custom ${
                    location.pathname === "/services" ? "text-cyan-400" : ""
                  }`}
                  aria-current={
                    location.pathname === "/services" ? "page" : undefined
                  }
                >
                  Services
                </Link>
              </li>
              <li>
              <Link
                to="/blogs"
                className={`block px-3 py-2 text-gray-900 text-sm font-medium hover:text-cyan-400 rounded-md transition-colors font-custom ${
                  location.pathname === "/contact" ? "text-cyan-400" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={
                  location.pathname === "/blogs" ? "page" : undefined
                }
              >
                Blogs
              </Link>
            </li>
              {!isAuthenticated && (
                <li>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 border border-cyan-500 text-cyan-500 rounded-full font-medium text-sm hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-colors"
                    aria-label="Log in"
                  >
                    Log in
                  </Link>
                </li>
              )}
            </ul>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>

            {/* User Dropdown */}
            {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-1 px-2 py-1 text-gray-900 hover:text-cyan-400 rounded-md transition-colors"
                  onClick={handleDropdownToggle}
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                  aria-controls="user-dropdown"
                >
                  <FaUser size={16} />
                  <FaChevronDown size={10} />
                  {(unreadCount > 0 || newOrdersCount > 0) && (
                    <span className="bg-cyan-400 text-gray-900 rounded-full px-1.5 py-0.5 text-xs font-semibold ml-1">
                      {unreadCount + newOrdersCount}
                    </span>
                  )}
                </button>

                {isDropdownOpen && (
                  <ul
                    id="user-dropdown"
                    className="absolute right-0 mt-7 w-56 bg-white rounded-lg shadow-md border border-gray-200 animate-fadeInUp z-50"
                  >
                    <li>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => setIsDropdownOpen(false)}
                        aria-label="View profile"
                      >
                        <FaUser className="text-cyan-400 mr-2" size={14} />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => setIsDropdownOpen(false)}
                        aria-label="View dashboard"
                      >
                        <FaTachometerAlt
                          className="text-cyan-400 mr-2"
                          size={14}
                        />
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/messages"
                        className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          fetchUnreadCount(true);
                        }}
                        aria-label="View messages"
                      >
                        <FaEnvelope className="text-cyan-400 mr-2" size={14} />
                        Messages
                        {unreadCount > 0 && (
                          <span className="bg-cyan-400 text-gray-900 rounded-full px-1.5 py-0.5 text-xs font-semibold ml-auto">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders"
                        className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => setIsDropdownOpen(false)}
                        aria-label="View orders"
                      >
                        <FaShoppingBag
                          className="text-cyan-400 mr-2"
                          size={14}
                        />
                        Orders
                        {newOrdersCount > 0 && (
                          <span className="bg-cyan-400 text-gray-900 rounded-full px-1.5 py-0.5 text-xs font-semibold ml-auto">
                            {newOrdersCount} New
                          </span>
                        )}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => setIsDropdownOpen(false)}
                        aria-label="View settings"
                      >
                        <FaCog className="text-cyan-400 mr-2" size={14} />
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-900 hover:bg-gray-100 hover:text-cyan-400 transition-colors text-sm font-medium"
                        aria-label="Log out"
                      >
                        <FaSignOutAlt
                          className="text-cyan-400 mr-2"
                          size={14}
                        />
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <ul
            ref={mobileMenuRef}
            id="mobile-menu"
            className="md:hidden bg-white absolute top-full left-0 right-0 z-40 px-4 py-4 border-t border-gray-200 shadow-md animate-fadeInUp"
          >
            <li>
              <Link
                to="/"
                className={`block px-3 py-2 text-gray-900 text-sm font-medium hover:bg-gray-100 hover:text-cyan-400 rounded-md transition-colors font-custom ${
                  location.pathname === "/" ? "text-cyan-400" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={location.pathname === "/" ? "page" : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={`block px-3 py-2 text-gray-900 text-sm font-medium hover:bg-gray-100 hover:text-cyan-400 rounded-md transition-colors font-custom ${
                  location.pathname === "/about" ? "text-cyan-400" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={
                  location.pathname === "/about" ? "page" : undefined
                }
              >
                About
              </Link>
            </li>
            <li>
              <Link
                to="/services"
                className={`block px-3 py-2 text-gray-900 text-sm font-medium hover:bg-gray-100 hover:text-cyan-400 rounded-md transition-colors font-custom ${
                  location.pathname === "/services" ? "text-cyan-400" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={
                  location.pathname === "/services" ? "page" : undefined
                }
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                to="/blogs"
                className={`block px-3 py-2 text-gray-900 text-sm font-medium hover:bg-gray-100 hover:text-cyan-400 rounded-md transition-colors font-custom ${
                  location.pathname === "/contact" ? "text-cyan-400" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={
                  location.pathname === "/blogs" ? "page" : undefined
                }
              >
                Blogs
              </Link>
            </li>
            
            {!isAuthenticated && (
              <li>
                <Link
                  to="/login"
                  className="block mt-2 px-3 py-1.5 border border-cyan-500 text-cyan-500 rounded-full font-medium text-sm hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 text-center transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Log in"
                >
                  Log in
                </Link>
              </li>
            )}
            
          </ul>
        )}
      </nav>
    </>
  );
}

export default Navbar;