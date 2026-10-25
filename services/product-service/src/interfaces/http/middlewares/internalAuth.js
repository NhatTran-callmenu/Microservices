
const crypto = require("crypto");

function internalAuth(req, res, next) {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.headers["x-internal-api-key"];

    if (!expected) {
        return res.status(503).json({
            error: "Internal API is not configured"
        });
    }

    if (typeof provided !== "string") {
        return res.status(401).json({
            error: "Internal authentication required"
        });
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);

    if (
        a.length !== b.length ||
        !crypto.timingSafeEqual(a, b)
    ) {
        return res.status(403).json({
            error: "Invalid internal API key"
        });
    }

    next();
}

module.exports = internalAuth;
