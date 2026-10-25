
const express = require("express");

const authenticate = require(
    "../middlewares/auth.middleware"
);

const authorize = require(
    "../middlewares/authorize.middleware"
);

const router = express.Router();

// API kiem tra JWT
router.get(
    "/api/auth/me",
    authenticate,
    (req, res) => {
        return res.status(200).json({
            message: "Authenticated successfully",
            user: req.user
        });
    }
);

// API chi ADMIN duoc truy cap
router.get(
    "/api/admin/test",
    authenticate,
    authorize(1),
    (req, res) => {
        return res.status(200).json({
            message: "Admin access granted",
            user: req.user
        });
    }
);

// API chi CUSTOMER duoc truy cap
router.get(
    "/api/customer/test",
    authenticate,
    authorize(2),
    (req, res) => {
        return res.status(200).json({
            message: "Customer access granted",
            user: req.user
        });
    }
);

module.exports = router;
