
require("dotenv").config();

const StockClient = require(
    "./src/infrastructure/clients/StockClient"
);

const client = new StockClient();

const oid = 800000000 + Math.floor(Math.random() * 100000000);
const pid = 1;
const quantity = 1;

async function main() {
    let reservationAttempted = false;
    let released = false;

    try {
        console.log("TEST ORDER ID:", oid);

        // Test 1: Reserve stock
        reservationAttempted = true;

        const first = await client.reserve(oid, pid, quantity);
        console.log("RESERVE:", first);

        if (!first.reserved) {
            throw new Error("Reserve stock failed");
        }

        // Test 2: Duplicate reservation
        const duplicate = await client.reserve(oid, pid, quantity);
        console.log("DUPLICATE RESERVE:", duplicate);

        if (!duplicate.reserved || !duplicate.alreadyReserved) {
            throw new Error("Duplicate reservation test failed");
        }

        // Test 3: Release stock
        const release = await client.release(oid, pid);
        released = release.released;

        console.log("RELEASE:", release);

        if (!released) {
            throw new Error("Release stock failed");
        }

        // Test 4: Duplicate release
        const duplicateRelease = await client.release(oid, pid);
        console.log("DUPLICATE RELEASE:", duplicateRelease);

        if (!duplicateRelease.alreadyReleased) {
            throw new Error("Duplicate release test failed");
        }

        console.log("ALL STOCK gRPC TESTS PASSED: true");

    } catch (error) {
        console.error("STOCK gRPC TEST ERROR:", error.message);
        process.exitCode = 1;

    } finally {
        // Only clean up automatically when the result
        // of the reservation is known to be successful.
        if (reservationAttempted && !released) {
            console.warn(
                "Check stock_reservations for order",
                oid,
                "and reconcile before retrying."
            );
        }

        client.client.close();
    }
}

main();
