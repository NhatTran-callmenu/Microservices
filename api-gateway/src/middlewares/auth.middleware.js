
const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    const parts = authorization.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer" ||
        !parts[1]
    ) {
        return res.status(401).json({
            error: "Invalid authorization header"
        });
    }

    const token = parts[1];

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");

        return res.status(500).json({
            error: "Authentication configuration error"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"],
                issuer: "auth-service",
                audience: "ecommerce-api"
            }
        );

        if (
            !Number.isInteger(decoded.uid) ||
            !Number.isInteger(decoded.roleid)
        ) {
            return res.status(401).json({
                error: "Invalid token claims"
            });
        }

        req.user = {
            uid: decoded.uid,
            roleid: decoded.roleid
        };

        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token expired"
            });
        }

        return res.status(401).json({
            error: "Invalid token"
        });
    }
}

module.exports = authenticate;
