
require("dotenv").config({ quiet: true });

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const LoginUser = require(
    "./src/application/use-cases/LoginUser"
);

async function testLogin() {
    const password = "TestPassword123!";
    const hashedPassword = await bcrypt.hash(password, 12);

    const fakeRepository = {
        async findByUsername(username) {
            if (username !== "customer_test_01") {
                return null;
            }

            return {
                uid: 1,
                username: "customer_test_01",
                password: hashedPassword,
                roleid: 2,

                toPublicJSON() {
                    return {
                        uid: this.uid,
                        username: this.username,
                        roleid: this.roleid
                    };
                }
            };
        }
    };

    const login = new LoginUser(fakeRepository);

    try {
        const result = await login.execute({
            username: "customer_test_01",
            password: "TestPassword123!"
        });

        const decoded = jwt.verify(
            result.accessToken,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"],
                issuer: "auth-service",
                audience: "ecommerce-api"
            }
        );

        console.log("Login:", result.message);
        console.log("Token valid:", !!decoded.uid);
        console.log("User:", result.user);
        console.log("Token type:", result.tokenType);
        console.log("Expires in:", result.expiresIn);

        // Kiem tra mat khau sai
        try {
            await login.execute({
                username: "customer_test_01",
                password: "WrongPassword"
            });
            console.log("Wrong password test: FAILED");
            process.exitCode = 1;
        } catch (error) {
            if (error.message !== "Invalid credentials") {
                throw error;
            }
            console.log("Wrong password test: PASSED");
        }

    } catch (error) {
        console.error("Login test error:", error.message);
        process.exitCode = 1;
    }
}

testLogin();
