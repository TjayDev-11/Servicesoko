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
import Messages from "./pages/Messages";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import Contact from "./pages/Contact";
import AddService from "./pages/AddService";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GoogleCallback from "./pages/GoogleCallback";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Footer from "./components/Footer";
import { Component } from "react";

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
      console.log(
        "bootstrapAuth called, token:",
        token ? token.substring(0, 10) + "..." : "null"
      );
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        console.log("Validating stored token");
        const user = await validateToken(storedToken);
        if (user) {
          console.log("Token valid, setting token and user");
          await setToken(
            storedToken,
            user,
            localStorage.getItem("refreshToken")
          );
        } else {
          console.log("Token invalid, clearing token");
          await setToken(null, null, null);
        }
      } else {
        console.log("No stored token, setting isAuthenticated to false");
        await setToken(null, null, null);
      }
      // Delay to ensure isAuthenticated is updated
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBootstrapped(true);
      console.log("Bootstrap complete, isAuthenticated:", isAuthenticated);
    };
    bootstrapAuth();
  }, [token, validateToken, setToken, setBootstrapped]);

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
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1F2937",
          color: "#FFF",
          fontSize: "18px",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  return (
    <Router>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Navbar />
        <div style={{ flex: 1 }}>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
