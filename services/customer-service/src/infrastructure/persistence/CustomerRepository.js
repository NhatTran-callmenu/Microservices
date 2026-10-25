
const pool = require("./database");

class CustomerRepository {
    async findByUid(uid) {
        const result = await pool.query(
            `SELECT c.uid, c.fullname, c.mid,
                    m.mname, m.score
             FROM customers c
             JOIN memberships m ON c.mid = m.mid
             WHERE c.uid = $1`,
            [uid]
        );

        return result.rows[0] || null;
    }

    async create({ uid, fullname, mid }) {
        const result = await pool.query(
            `INSERT INTO customers (uid, fullname, mid)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [uid, fullname, mid]
        );

        return result.rows[0];
    }

    async update(uid, { fullname, mid }) {
        const result = await pool.query(
            `UPDATE customers
             SET fullname = $1, mid = $2
             WHERE uid = $3
             RETURNING *`,
            [fullname, mid, uid]
        );

        return result.rows[0] || null;
    }
}

module.exports = CustomerRepository;
