const orderAuth = require("./middlewares/orderAuth.middleware");
const authorize = require("./middlewares/authorize.middleware");
const productAuth = require("./middlewares/productAuth.middleware");
const authenticate = require("./middlewares/auth.middleware");
const protectedRoutes = require("./routes/protected.routes");
const express = require("express");

const logger = require("./middlewares/logger.middleware");
const rateLimiter = require("./middlewares/rateLimit.middleware");

const healthRoutes = require("./routes/health.routes");
const proxyRoutes = require("./routes/proxy.routes");

const app = express();
app.use((req, res, next) => {
    if (
        req.originalUrl.startsWith("/api/auth") ||
        req.originalUrl.startsWith("/api/customers") ||
        req.originalUrl.startsWith("/api/products") ||
        req.originalUrl.startsWith("/api/orders") ||
        req.originalUrl.startsWith("/api/shipments")
    ) {
        return next();
    }

    return express.json()(req, res, next);
});
// Ghi log request
app.use(logger);

// Health check khong bi rate limit
app.use(healthRoutes);

// Gioi han request den cac Microservices
app.use("/api", rateLimiter);

app.use(protectedRoutes);

// Customer API
app.use("/api/customers", authenticate);

// Product API
app.use("/api/products", productAuth);

// Order API: tam thoi chi ADMIN duoc truy cap
app.use("/api/orders", authenticate, orderAuth);

app.use("/api/shipments", authenticate, authorize(1));



// Chuyen request den Microservices
app.use(proxyRoutes);

module.exports = app;
