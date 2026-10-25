
const { Kafka } = require("kafkajs");
const pool = require("../persistence/database");

const brokers = (
    process.env.KAFKA_BROKERS || "localhost:9092"
).split(",");

const kafka = new Kafka({
    clientId: "order-service",
    brokers
});

const producer = kafka.producer();

let running = false;
let timer = null;
let busy = false;

async function publishPendingEvents() {
    if (busy) return;
    busy = true;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, aggregate_id, event_type, payload
             FROM outbox_events
             WHERE published_at IS NULL
             ORDER BY id
             LIMIT 20
             FOR UPDATE SKIP LOCKED`
        );

        for (const event of result.rows) {
            await producer.send({
                topic: "order-created",
                messages: [
                    {
                        key: String(event.aggregate_id),
                        value: JSON.stringify(event.payload)
                    }
                ]
            });

            await client.query(
                `UPDATE outbox_events
                 SET published_at = NOW()
                 WHERE id = $1`,
                [event.id]
            );

            console.log(
                `OrderCreated published: ${event.aggregate_id}`
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Outbox Publisher error:", error.message);
    } finally {
        client.release();
        busy = false;
    }
}

async function startOutboxPublisher() {
    if (running) return;

    await producer.connect();
    running = true;

    console.log("Kafka Producer connected");

    await publishPendingEvents();

    timer = setInterval(() => {
        publishPendingEvents().catch(error => {
            console.error("Outbox polling error:", error.message);
        });
    }, 3000);
}

async function stopOutboxPublisher() {
    if (timer) clearInterval(timer);
    running = false;

    while (busy) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    await producer.disconnect();
}

module.exports = {
    startOutboxPublisher,
    stopOutboxPublisher
};
