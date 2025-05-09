import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("No token provided", { path: req.path, method: req.method });
    return res.status(401).json({
      error: "Unauthorized",
      code: "MISSING_TOKEN",
      message: "No authorization token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      console.error("Token payload missing user ID", {
        decoded,
        path: req.path,
      });
      return res.status(401).json({
        error: "Unauthorized",
        code: "INVALID_TOKEN_PAYLOAD",
        message: "Token payload missing user ID",
      });
    }

    console.log("Token verified successfully", {
      userId: decoded.id,
      role: decoded.role,
      path: req.path,
      method: req.method,
    });
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error("Authentication Error:", {
      message: error.message,
      stack: error.stack,
      token: token.substring(0, 10) + "...",
      path: req.path,
      method: req.method,
    });

    const response = {
      error: "Forbidden",
      code: "INVALID_TOKEN",
      message: "Authentication failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };

    if (error.name === "TokenExpiredError") {
      response.code = "TOKEN_EXPIRED";
      response.message = "Token expired";
    } else if (error.name === "JsonWebTokenError") {
      response.message = "Invalid token";
    }

    return res.status(403).json(response);
  }
};

export default authenticateToken;
