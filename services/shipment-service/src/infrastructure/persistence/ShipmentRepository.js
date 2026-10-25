
const pool = require("./database");

class ShipmentRepository {
    async findAll() {
        const result = await pool.query(
            "SELECT * FROM shipments ORDER BY sid DESC"
        );
        return result.rows;
    }

    async findById(sid) {
        const result = await pool.query(
            "SELECT * FROM shipments WHERE sid = $1",
            [sid]
        );
        return result.rows[0] || null;
    }

    async findByOrderId(oid) {
        const result = await pool.query(
            "SELECT * FROM shipments WHERE oid = $1",
            [oid]
        );
        return result.rows[0] || null;
    }

    async create(data) {
        const result = await pool.query(
            `INSERT INTO shipments (
                oid, receiver_name, receiver_phone,
                shipping_address, carrier, tracking_number
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                data.oid,
                data.receiver_name,
                data.receiver_phone,
                data.shipping_address,
                data.carrier || null,
                data.tracking_number || null
            ]
        );

        return result.rows[0];
    }

    async updateStatus(sid, status) {
        const result = await pool.query(
            `UPDATE shipments
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE sid = $2
             RETURNING *`,
            [status, sid]
        );

        return result.rows[0] || null;
    }
    
    async createFromOrderEvent(data) {
        const result = await pool.query(
            `INSERT INTO shipments (
                oid,
                receiver_name,
                receiver_phone,
                shipping_address,
                status
            )
            VALUES ($1, $2, $3, $4, 'PENDING')
            ON CONFLICT (oid) DO NOTHING
            RETURNING *`,
            [
                data.oid,
                data.receiver_name,
                data.receiver_phone,
                data.shipping_address
            ]
        );

        if (result.rowCount > 0) {
            return {
                created: true,
                shipment: result.rows[0]
            };
        }

        return {
            created: false,
            shipment: await this.findByOrderId(data.oid)
        };
    }

}

module.exports = ShipmentRepository;
