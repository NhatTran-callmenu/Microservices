
const UserRepository = require(
    "../../../infrastructure/persistence/UserRepository"
);

const RegisterUser = require(
    "../../../application/use-cases/RegisterUser"
);

const LoginUser = require(
    "../../../application/use-cases/LoginUser"
);

const userRepository = new UserRepository();

const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository);

// REGISTER
async function register(req, res) {
    try {
        const { username, password } = req.body || {};

        const user = await registerUser.execute({
            username,
            password
        });

        return res.status(201).json({
            message: "User registered successfully",
            user
        });
    } catch (error) {
        if (
            error.message === "Username already exists" ||
            error.code === "23505"
        ) {
            return res.status(409).json({
                error: "Username already exists"
            });
        }

        if (
            error.message === "Username and password are required" ||
            error.message === "Username must be 3-50 characters" ||
            error.message === "Password must be 8-72 characters"
        ) {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error("Register error:", error);

        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

// LOGIN
async function login(req, res) {
    try {
        const { username, password } = req.body || {};

        const result = await loginUser.execute({
            username,
            password
        });

        return res.status(200).json(result);
    } catch (error) {
        if (
            error.message === "Invalid credentials"
        ) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        if (
            error.message === "Username and password are required"
        ) {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error("Login error:", error);

        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

module.exports = { register, login };
