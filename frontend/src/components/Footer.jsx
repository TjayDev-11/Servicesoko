import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";

function Footer() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const footerRef = useRef(null);
  const sectionRefs = useRef([]);

  // Animate footer sections on scroll
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

    if (footerRef.current) observer.observe(footerRef.current);
    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (footerRef.current) observer.unobserve(footerRef.current);
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  // Handle newsletter subscription
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ message: "Please enter an email address", type: "error" });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({
        message: "Please enter a valid email address",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    // Simulate API call for subscription
    setFeedback({ message: "Subscribed successfully!", type: "success" });
    setEmail("");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <footer
      ref={footerRef}
      className="bg-black text-white text-opacity-80 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-white border-opacity-10 opacity-0"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
        {/* Company Info */}
        <div
          ref={(el) => (sectionRefs.current[0] = el)}
          className="opacity-0 animate-fadeInUp"
        >
          <h3 className="text-xl font-semibold text-white mb-5">
            Service<span className="text-cyan-400">Soko</span>
          </h3>
          <p className="text-gray-400 mb-5 leading-relaxed text-sm">
            Connecting skilled professionals with customers across Kenya. Your
            trusted marketplace for quality services.
          </p>
          <div className="flex gap-4">
            {[
              {
                icon: <FaFacebookF />,
                href: "https://facebook.com/servicesoko",
                label: "Facebook",
              },
              {
                icon: <FaTwitter />,
                href: "https://twitter.com/servicesoko",
                label: "Twitter",
              },
              {
                icon: <FaInstagram />,
                href: "https://instagram.com/servicesoko",
                label: "Instagram",
              },
              {
                icon: <FaLinkedinIn />,
                href: "https://linkedin.com/company/servicesoko",
                label: "LinkedIn",
              },
            ].map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-cyan-400 transition-colors text-xl"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div
          ref={(el) => (sectionRefs.current[1] = el)}
          className="opacity-0 animate-fadeInUp animation-delay-200"
        >
          <h4 className="text-lg font-medium text-white mb-5">Quick Links</h4>
          <ul className="list-none p-0">
            {[
              { to: "/about", label: "About Us" },
              { to: "/services", label: "Services" },
              { to: "/blog", label: "Blog" },
              { to: "/careers", label: "Careers" },
              { to: "/contact", label: "Contact Us" },
            ].map((link, index) => (
              <li key={index} className="mb-3">
                <Link
                  to={link.to}
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Popular Services */}
        <div
          ref={(el) => (sectionRefs.current[2] = el)}
          className="opacity-0 animate-fadeInUp animation-delay-200"
        >
          <h4 className="text-lg font-medium text-white mb-5">
            Popular Services
          </h4>
          <ul className="list-none p-0">
            {[
              { to: "/services/plumbing", label: "Plumbing" },
              { to: "/services/electrical", label: "Electrical" },
              { to: "/services/cleaning", label: "Cleaning" },
              { to: "/services/moving", label: "Moving & Packing" },
              { to: "/services/beauty", label: "Beauty Services" },
            ].map((service, index) => (
              <li key={index} className="mb-3">
                <Link
                  to={service.to}
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                >
                  {service.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div
          ref={(el) => (sectionRefs.current[3] = el)}
          className="opacity-0 animate-fadeInUp animation-delay-400"
        >
          <h4 className="text-lg font-medium text-white mb-5">Contact Us</h4>
          <address className="not-italic text-gray-400 text-sm leading-relaxed">
            <div className="flex items-center mb-3">
              <FaMapMarkerAlt className="text-cyan-400 mr-2" />
              Nairobi, Kenya
            </div>
            <div className="flex items-center mb-3">
              <FaPhoneAlt className="text-cyan-400 mr-2" />
              +254 700 123 456
            </div>
            <div className="flex items-center mb-3">
              <FaEnvelope className="text-cyan-400 mr-2" />
              hello@servicesoko.co.ke
            </div>
            <div className="flex items-center">
              <FaClock className="text-cyan-400 mr-2" />
              Mon-Fri: 8AM - 6PM
            </div>
          </address>
        </div>

        {/* Newsletter */}
        <div
          ref={(el) => (sectionRefs.current[4] = el)}
          className="opacity-0 animate-fadeInUp animation-delay-400"
        >
          <h4 className="text-lg font-medium text-white mb-5">Newsletter</h4>
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">
            Subscribe to get updates on new services and promotions
          </p>
          {feedback && (
            <div
              className={`mb-3 p-2 rounded-lg text-sm ${
                feedback.type === "success"
                  ? "bg-green-500 bg-opacity-20 text-green-400"
                  : "bg-red-500 bg-opacity-20 text-red-400"
              }`}
            >
              {feedback.message}
            </div>
          )}
          <form onSubmit={handleSubscribe} className="flex">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-l-md text-white text-sm focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              aria-label="Newsletter email"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-cyan-400 text-black font-semibold rounded-r-md hover:bg-cyan-500 hover:shadow-lg transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto border-t border-white border-opacity-10 pt-8 text-center text-gray-500 text-sm animate-fadeInUp animation-delay-600">
        <div className="mb-4 flex flex-wrap justify-center gap-4">
          <Link
            to="/terms"
            className="text-gray-500 hover:text-cyan-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="text-gray-500 hover:text-cyan-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookies"
            className="text-gray-500 hover:text-cyan-400 transition-colors"
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
