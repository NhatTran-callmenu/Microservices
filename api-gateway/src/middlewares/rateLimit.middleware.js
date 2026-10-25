
const redisClient = require("../config/redis");

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 60;

const luaScript = `
    local current = redis.call("INCR", KEYS[1])

    if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
    end

    local ttl = redis.call("TTL", KEYS[1])

    return { current, ttl }
`;

async function rateLimiter(req, res, next) {
    try {
        const clientIp = req.ip;
        const key = `rate-limit:${clientIp}`;

        const result = await redisClient.eval(luaScript, {
            keys: [key],
            arguments: [String(WINDOW_SECONDS)]
        });

        const requestCount = Number(result[0]);
        const ttl = Number(result[1]);

        res.setHeader("RateLimit-Limit", MAX_REQUESTS);
        res.setHeader(
            "RateLimit-Remaining",
            Math.max(0, MAX_REQUESTS - requestCount)
        );

        if (requestCount > MAX_REQUESTS) {
            res.setHeader("Retry-After", Math.max(1, ttl));

            return res.status(429).json({
                error: "Too Many Requests",
                message: "Rate limit exceeded. Please try again later."
            });
        }

        next();
    } catch (error) {
        console.error("Rate Limiting Error:", error.message);

        return res.status(503).json({
            error: "Service Unavailable",
            message: "Rate limiting service unavailable"
        });
    }
}

module.exports = rateLimiter;
