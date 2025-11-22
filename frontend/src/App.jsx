import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import useStore from "./store";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPosts";
import Messages from "./pages/Messages";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import BecomeSeller from "./pages/BecomeSeller";
import Contact from "./pages/Contact";
import AddService from "./pages/AddService";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GoogleAuthCallback from "./components/GoogleAuthCallback";
import GoogleCallback from "./pages/GoogleCallback";
import Settings from "./pages/Settings"; 
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Footer from "./components/Footer";
import { Component } from "react";
import ScrollToTop from "./ScrollToTop";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#FFF",
            backgroundColor: "#1F2937",
            minHeight: "100vh",
          }}
        >
          Something went wrong. Please try refreshing the page or{" "}
          <a href="/contact" style={{ color: "#bb86fc" }}>
            contact support
          </a>
          .
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const {
    isAuthenticated,
    token,
    validateToken,
    setToken,
    bootstrapped,
    setBootstrapped,
  } = useStore();

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");

      console.log("Bootstrapping auth. Stored token:", storedToken);

      // Only attempt to validate if token is present and not the string "null"
      if (storedToken && storedToken !== "null") {
        console.log("Valid token found, validating...");

        try {
          const user = await validateToken(storedToken);
          if (user) {
            console.log("Token valid, setting token and user.");
            await setToken(storedToken, user, refreshToken);
          } else {
            console.log("Token invalid, clearing auth.");
            await setToken(null, null, null);
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
          }
        } catch (err) {
          console.error("Error validating token:", err);
          await setToken(null, null, null);
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
        }
      } else {
        console.log("No token present, skipping validation.");
        await setToken(null, null, null);
      }

      setBootstrapped(true);
    };

    bootstrapAuth();
  }, [validateToken, setToken, setBootstrapped]);

  console.log(
    "App render, isAuthenticated:",
    isAuthenticated,
    "bootstrapped:",
    bootstrapped
  );
  console.log(
    "Rendering route for /dashboard:",
    isAuthenticated ? "Dashboard" : "Navigate to /login"
  );

  if (!bootstrapped) {
    return null;
  }

  return (
    <Router>
      <ScrollToTop />
      <div
        style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}
      >
        <Navbar />
        <div style={{ flex: 1, minWidth: "100%" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Signup />
                )
              }
            />
            <Route path="/become-seller" element={<BecomeSeller />} />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/messages"
              element={
                isAuthenticated ? (
                  <ErrorBoundary>
                    <Messages />
                  </ErrorBoundary>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/services/:category" element={<ServiceDetails />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/add-service"
              element={
                isAuthenticated ? (
                  <AddService />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/orders"
              element={
                isAuthenticated ? <Orders /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <ErrorBoundary>
                    <Settings />
                  </ErrorBoundary>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;