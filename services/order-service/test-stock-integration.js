
require("dotenv").config();

const assert = require("node:assert/strict");
const StockClient = require("./src/infrastructure/clients/StockClient");

const client = new StockClient();
const baseUrl = process.env.PRODUCT_SERVICE_URL;

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(5000)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${JSON.stringify(data)}`
        );
    }

    return data;
}

async function main() {
    let pid = null;
    let oid = null;
    let reserveAttempted = false;
    let safeToDelete = true;

    try {
        // 1. Tao san pham test rieng
        const product = await request("/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pname: "ORDER_STOCK_TEST_TEMP",
                price: 10000,
                stock: 5,
                cid: 1
            })
        });

        pid = product.pid;
        oid = -pid;

        console.log("Test product PID:", pid);

        // 2. Order Service goi Product Service giu 2 hang
        reserveAttempted = true;
        const reserved = await client.reserve(oid, pid, 2);

        assert.equal(reserved.reserved, true);
        console.log("TEST 1 - Reserve:", "PASS");

        // 3. Kiem tra kho con 3
        const afterReserve = await request(`/products/${pid}`);

        assert.equal(afterReserve.stock, 3);
        console.log("TEST 2 - Stock reduced:", "PASS");

        // 4. Goi giu hang trung
        const duplicate = await client.reserve(oid, pid, 2);

        assert.equal(duplicate.alreadyReserved, true);
        console.log("TEST 3 - Idempotency:", "PASS");

        // 5. Hoan tra 2 hang
        const released = await client.release(oid, pid);

        assert.equal(released.released, true);
        console.log("TEST 4 - Release:", "PASS");

        // 6. Kiem tra kho ve 5
        const afterRelease = await request(`/products/${pid}`);

        assert.equal(afterRelease.stock, 5);
        console.log("TEST 5 - Stock restored:", "PASS");

        console.log("ALL INTEGRATION TESTS PASSED: true");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        if (pid !== null) {
            try {
                // Neu da goi reserve, luon thu release
                if (reserveAttempted) {
                    await client.release(oid, pid);
                }

                await request(`/products/${pid}`, {
                    method: "DELETE"
                });

                console.log("Temporary product cleaned up");
            } catch (error) {
                safeToDelete = false;
                console.error(
                    "Cleanup uncertain. Check test product manually:",
                    pid,
                    error.message
                );
                process.exitCode = 1;
            }
        }
    }
}

main();
