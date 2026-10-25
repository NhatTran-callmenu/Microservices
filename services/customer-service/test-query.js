require("dotenv").config();

const pool = require("./src/infrastructure/persistence/database");

async function main() {
    try {
        const customer = await pool.query(
            "SELECT uid, fullname, mid FROM customers WHERE uid = $1",
            [1]
        );

        console.log("CUSTOMER:", customer.rows);

        const membership = await pool.query(
            `SELECT m.mid, m.mname, m.score
             FROM customers c
             JOIN memberships m ON c.mid = m.mid
             WHERE c.uid = $1`,
            [1]
        );

        console.log("MEMBERSHIP:", membership.rows);
        console.log("SQL TEST PASSED: true");
    } catch (error) {
        console.error("SQL ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();