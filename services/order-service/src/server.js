
require("dotenv").config();

const app = require("./app");

const {
    startOutboxPublisher,
    stopOutboxPublisher
} = require("./infrastructure/messaging/OutboxPublisher");

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
});

startOutboxPublisher().catch(error => {
    console.error("Kafka startup error:", error.message);
});

async function shutdown() {
    try {
        await stopOutboxPublisher();
    } catch (error) {
        console.error("Kafka shutdown error:", error.message);
    }

    server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
