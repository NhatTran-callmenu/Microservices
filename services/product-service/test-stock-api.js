
require("dotenv").config();

const assert = require("node:assert/strict");
const pool = require("./src/infrastructure/persistence/database");

const BASE_URL = "http://localhost:3003/internal/stock";
const API_KEY = process.env.INTERNAL_API_KEY;

async function callStockAPI(action, body) {
    const response = await fetch(`${BASE_URL}/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": API_KEY
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
    });

    return {
        status: response.status,
        data: await response.json()
    };
}

async function main() {
    if (!API_KEY || API_KEY.includes("THAY_BANG")) {
        throw new Error("INTERNAL_API_KEY is not configured");
    }

    let pid = null;
    let oid = null;

    try {
        // Tao san pham kiem thu, ton kho = 3
        const created = await pool.query(
            `INSERT INTO products (pname, price, stock, cid)
             VALUES ($1, $2, $3, $4)
             RETURNING pid`,
            ["STOCK_API_TEST_TEMP", 10000, 3, 1]
        );

        pid = created.rows[0].pid;
        oid = -pid;

        console.log("Test Product PID:", pid);

        // TEST 1: Giu 2 san pham
        const first = await callStockAPI("reserve", {
            oid,
            pid,
            quantity: 2
        });

        assert.equal(first.status, 200);
        assert.equal(first.data.reserved, true);
        assert.equal(first.data.alreadyReserved, false);

        console.log("TEST 1 - Reserve:", "PASS");

        // TEST 2: Goi lai cung don hang
        const duplicate = await callStockAPI("reserve", {
            oid,
            pid,
            quantity: 2
        });

        assert.equal(duplicate.status, 200);
        assert.equal(duplicate.data.alreadyReserved, true);

        console.log("TEST 2 - Duplicate:", "PASS");

        // TEST 3: Don khac mua 2, chi con 1
        const insufficient = await callStockAPI("reserve", {
            oid: oid - 1000000,
            pid,
            quantity: 2
        });

        assert.equal(insufficient.status, 409);
        assert.equal(insufficient.data.reserved, false);

        console.log("TEST 3 - Insufficient:", "PASS");

        // TEST 4: Hoan tra ton kho
        const released = await callStockAPI("release", {
            oid,
            pid
        });

        assert.equal(released.status, 200);
        assert.equal(released.data.released, true);
        assert.equal(released.data.alreadyReleased, false);

        console.log("TEST 4 - Release:", "PASS");

        // TEST 5: Goi hoan tra lan hai
        const duplicateRelease = await callStockAPI("release", {
            oid,
            pid
        });

        assert.equal(duplicateRelease.status, 200);
        assert.equal(duplicateRelease.data.alreadyReleased, true);

        console.log("TEST 5 - Duplicate release:", "PASS");

        // TEST 6: Ton kho phai tro ve 3
        const result = await pool.query(
            "SELECT stock FROM products WHERE pid = $1",
            [pid]
        );

        assert.equal(result.rows[0].stock, 3);

        console.log("TEST 6 - Stock restored:", "PASS");
        console.log("ALL API TESTS PASSED: true");

    } finally {
        if (pid !== null) {
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                await client.query(
                    "DELETE FROM stock_reservations WHERE pid = $1",
                    [pid]
                );

                await client.query(
                    "DELETE FROM products WHERE pid = $1",
                    [pid]
                );

                await client.query("COMMIT");
                console.log("Temporary test data cleaned up");
            } catch (error) {
                await client.query("ROLLBACK");
                console.error("Cleanup failed:", error.message);
                process.exitCode = 1;
            } finally {
                client.release();
            }
        }

        await pool.end();
    }
}

main().catch(error => {
    console.error("TEST FAILED:", error.message);
    process.exitCode = 1;
});
