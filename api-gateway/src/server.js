
const app = require("./app");
const redisClient = require("./config/redis");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await redisClient.connect();

        app.listen(PORT, () => {
            console.log(`API Gateway running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start API Gateway:", error.message);
        process.exit(1);
    }
}
require("dotenv").config();
startServer();
