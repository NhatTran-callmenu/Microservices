const pool = require("./database");

class ProductRepository {
    async findAll() {
        const result = await pool.query(`
            SELECT p.pid, p.pname, p.price, p.stock,
                   p.cid, c.cname
            FROM products p
            JOIN categories c ON p.cid = c.cid
            ORDER BY p.pid
        `);

        return result.rows;
    }

    async findById(pid) {
        const result = await pool.query(`
            SELECT p.pid, p.pname, p.price, p.stock,
                   p.cid, c.cname
            FROM products p
            JOIN categories c ON p.cid = c.cid
            WHERE p.pid = $1
        `, [pid]);

        return result.rows[0] || null;
    }

    async create({ pname, price, stock, cid }) {
        const result = await pool.query(`
            INSERT INTO products (pname, price, stock, cid)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [pname, price, stock, cid]);

        return result.rows[0];
    }

    async update(pid, { pname, price, stock, cid }) {
        const result = await pool.query(`
            UPDATE products
            SET pname = $1,
                price = $2,
                stock = $3,
                cid = $4
            WHERE pid = $5
            RETURNING *
        `, [pname, price, stock, cid, pid]);

        return result.rows[0] || null;
    }

    async delete(pid) {
        const result = await pool.query(
            "DELETE FROM products WHERE pid = $1 RETURNING *",
            [pid]
        );

        return result.rows[0] || null;
    }

    async findCategories() {
        const result = await pool.query(
            "SELECT * FROM categories ORDER BY cid"
        );

        return result.rows;
    }
    
async reserveStock(oid, pid, quantity) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Ghi nhan reservation, tranh tru hang trung
        const reservation = await client.query(
            `INSERT INTO stock_reservations (oid, pid, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (oid, pid) DO NOTHING
             RETURNING id`,
            [oid, pid, quantity]
        );

        if (reservation.rowCount === 0) {
            const existing = await client.query(
                `SELECT quantity
                 FROM stock_reservations
                 WHERE oid = $1 AND pid = $2`,
                [oid, pid]
            );

            await client.query("COMMIT");

            if (existing.rows[0] &&
                existing.rows[0].quantity === quantity) {
                return { reserved: true, alreadyReserved: true };
            }

            return { reserved: false, reason: "RESERVATION_CONFLICT" };
        }

        // Tru kho nguyen tu: chi tru khi du hang
        const result = await client.query(
            `UPDATE products
             SET stock = stock - $1
             WHERE pid = $2 AND stock >= $1
             RETURNING pid, stock`,
            [quantity, pid]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");

            return { reserved: false, reason: "INSUFFICIENT_STOCK" };
        }

        await client.query("COMMIT");

        return {
            reserved: true,
            alreadyReserved: false,
            product: result.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async releaseStock(oid, pid) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const reservation = await client.query(
            `DELETE FROM stock_reservations
             WHERE oid = $1 AND pid = $2
             RETURNING quantity`,
            [oid, pid]
        );

        if (reservation.rowCount === 0) {
            await client.query("COMMIT");
            return {
                released: true,
                alreadyReleased: true
            };
        }

        const quantity = reservation.rows[0].quantity;

        const result = await client.query(
            `UPDATE products
             SET stock = stock + $1
             WHERE pid = $2
             RETURNING pid, stock`,
            [quantity, pid]
        );

        if (result.rowCount === 0) {
            throw new Error("Product not found during stock release");
        }

        await client.query("COMMIT");

        return {
            released: true,
            alreadyReleased: false,
            product: result.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

}

module.exports = ProductRepository;