
const pool = require("./database");

class OrderRepository {

    // ==========================================
    // 1. CREATE ORDER
    // ==========================================
    async createOrder(
        uid,
        items,
        totalAmount,
        subtotalAmount,
        discountPercent,
        discountAmount,
        shipping = null
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Create order with RESERVING status
            const orderResult = await client.query(
                `INSERT INTO orders (
                    uid,
                    subtotal_amount,
                    discount_percent,
                    discount_amount,
                    total_amount,
                    status,
                    receiver_name,
                    receiver_phone,
                    shipping_address
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    'RESERVING', $6, $7, $8
                )
                RETURNING *`,
                [
                    uid,
                    subtotalAmount,
                    discountPercent,
                    discountAmount,
                    totalAmount,
                    shipping?.receiver_name ?? null,
                    shipping?.receiver_phone ?? null,
                    shipping?.shipping_address ?? null
                ]
            );

            const order = orderResult.rows[0];

            // Save order details
            for (const item of items) {
                await client.query(
                    `INSERT INTO order_details (
                        oid,
                        pid,
                        quantity,
                        unit_price,
                        subtotal
                    )
                    VALUES ($1, $2, $3, $4, $5)`,
                    [
                        order.oid,
                        item.pid,
                        item.quantity,
                        item.unit_price,
                        item.subtotal
                    ]
                );
            }

            await client.query("COMMIT");

            return await this.findById(order.oid);

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    // ==========================================
    // 2. GET ALL ORDERS
    // ==========================================
    async findAll() {
        const result = await pool.query(
            "SELECT * FROM orders ORDER BY oid DESC"
        );

        return result.rows;
    }

    // ==========================================
    // 3. GET ORDER BY ID
    // ==========================================
    async findById(oid) {
        const result = await pool.query(
            "SELECT * FROM orders WHERE oid = $1",
            [oid]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const details = await pool.query(
            `SELECT *
             FROM order_details
             WHERE oid = $1
             ORDER BY odid`,
            [oid]
        );

        return {
            ...result.rows[0],
            details: details.rows
        };
    }

    // ==========================================
    // 4. GET ORDERS BY CUSTOMER
    // ==========================================
    async findByCustomer(uid) {
        const result = await pool.query(
            `SELECT *
             FROM orders
             WHERE uid = $1
             ORDER BY oid DESC`,
            [uid]
        );

        return result.rows;
    }

    // ==========================================
    // 5. UPDATE ORDER STATUS
    // ==========================================
    async updateStatus(oid, status) {
        const result = await pool.query(
            `UPDATE orders
             SET status = $1
             WHERE oid = $2
             RETURNING *`,
            [status, oid]
        );

        return result.rows[0] || null;
    }

    // ==========================================
    // 6. CONFIRM ORDER AND CREATE OUTBOX EVENT
    // ==========================================
    async confirmOrderAndCreateEvent(oid) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Lock order row to prevent concurrent updates
            const orderResult = await client.query(
                `SELECT *
                 FROM orders
                 WHERE oid = $1
                 FOR UPDATE`,
                [oid]
            );

            if (orderResult.rowCount === 0) {
                throw new Error("Order not found");
            }

            const order = orderResult.rows[0];

            if (order.status !== "RESERVING") {
                throw new Error(
                    `Cannot confirm order in status ${order.status}`
                );
            }

            // Get order details
            const detailsResult = await client.query(
                `SELECT
                    pid,
                    quantity,
                    unit_price,
                    subtotal
                 FROM order_details
                 WHERE oid = $1
                 ORDER BY odid`,
                [oid]
            );

            // Change order status to PENDING
            const updatedResult = await client.query(
                `UPDATE orders
                 SET status = 'PENDING'
                 WHERE oid = $1
                 RETURNING *`,
                [oid]
            );

            const updatedOrder = updatedResult.rows[0];

            // Create OrderCreated event payload
            const eventPayload = {
                eventType: "OrderCreated",

                oid: updatedOrder.oid,
                uid: updatedOrder.uid,
                status: updatedOrder.status,

                receiver_name: updatedOrder.receiver_name,
                receiver_phone: updatedOrder.receiver_phone,
                shipping_address: updatedOrder.shipping_address,

                subtotalAmount: updatedOrder.subtotal_amount,
                discountPercent: updatedOrder.discount_percent,
                discountAmount: updatedOrder.discount_amount,
                totalAmount: updatedOrder.total_amount,

                items: detailsResult.rows
            };

            // Save event in the same transaction
            await client.query(
                `INSERT INTO outbox_events (
                    aggregate_id,
                    event_type,
                    payload
                )
                VALUES ($1, $2, $3::jsonb)
                ON CONFLICT (aggregate_id, event_type)
                DO NOTHING`,
                [
                    oid,
                    "OrderCreated",
                    JSON.stringify(eventPayload)
                ]
            );

            await client.query("COMMIT");

            return updatedOrder;

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = OrderRepository;
