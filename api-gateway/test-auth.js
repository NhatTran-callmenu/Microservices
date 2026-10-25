
require("dotenv").config({ quiet: true });

const jwt = require("jsonwebtoken");
const authenticate = require(
    "./src/middlewares/auth.middleware"
);

function runMiddleware(token) {
    return new Promise((resolve) => {
        const req = {
            headers: token
                ? { authorization: `Bearer ${token}` }
                : {}
        };

        const res = {
            status(code) {
                this.statusCode = code;
                return this;
            },

            json(data) {
                resolve({
                    status: this.statusCode,
                    body: data
                });
            }
        };

        authenticate(req, res, () => {
            resolve({
                status: 200,
                user: req.user
            });
        });
    });
}

async function main() {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET missing");
    }

    const token = jwt.sign(
        { uid: 1, roleid: 2 },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: "1h",
            issuer: "auth-service",
            audience: "ecommerce-api"
        }
    );

    const valid = await runMiddleware(token);
    const missing = await runMiddleware(null);
    const invalid = await runMiddleware("invalid-token");

    console.log("Valid token:", valid);
    console.log("Missing token:", missing.status);
    console.log("Invalid token:", invalid.status);

    if (
        valid.status !== 200 ||
        valid.user.uid !== 1 ||
        missing.status !== 401 ||
        invalid.status !== 401
    ) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
});
