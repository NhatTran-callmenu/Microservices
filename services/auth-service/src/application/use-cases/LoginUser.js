
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class LoginUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute({ username, password }) {
        // 1. Kiem tra du lieu
        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            throw new Error("Username and password are required");
        }

        // 2. Tim User
        const user = await this.userRepository.findByUsername(
            username.trim()
        );

        if (!user) {
            throw new Error("Invalid credentials");
        }

        // 3. Kiem tra mat khau
        const isValidPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }

        // 4. Kiem tra khoa JWT
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT configuration missing");
        }

        // 5. Tao JWT
        const accessToken = jwt.sign(
            {
                uid: user.uid,
                roleid: user.roleid
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "1h",
                issuer: "auth-service",
                audience: "ecommerce-api"
            }
        );

        // 6. Tra ket qua
        return {
            message: "Login successful",
            accessToken,
            tokenType: "Bearer",
            expiresIn: 3600,
            user: user.toPublicJSON()
        };
    }
}

module.exports = LoginUser;
