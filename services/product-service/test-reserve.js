
const pool = require("./src/infrastructure/persistence/database");
const ProductRepository = require(
    "./src/infrastructure/persistence/ProductRepository"
);

const repository = new ProductRepository();

async function main() {
    let testPid = null;

    try {
        // Tao san pham rieng cho kiem thu
        const result = await pool.query(
            `INSERT INTO products (pname, price, stock, cid)
             VALUES ($1, $2, $3, $4)
             RETURNING pid`,
            ["STOCK_TEST_TEMP", 10000, 3, 1]
        );

        testPid = result.rows[0].pid;

        console.log("Test product PID:", testPid);

        // Lan 1: Tru 2 san pham
        const first = await repository.reserveStock(
            -1, testPid, 2
        );
        console.log("First reservation:", first);

        // Lan 2: Khong duoc tru trung
        const duplicate = await repository.reserveStock(
            -1, testPid, 2
        );
        console.log("Duplicate reservation:", duplicate);

        // Don khac mua 2, nhung chi con 1
        const insufficient = await repository.reserveStock(
            -2, testPid, 2
        );
        console.log("Insufficient stock:", insufficient);

        const stock = await pool.query(
            "SELECT stock FROM products WHERE pid = $1",
            [testPid]
        );

        console.log("Final test stock:", stock.rows[0].stock);

        const passed =
            first.reserved === true &&
            first.alreadyReserved === false &&
            duplicate.reserved === true &&
            duplicate.alreadyReserved === true &&
            insufficient.reserved === false &&
            stock.rows[0].stock === 1;

        console.log("ALL TESTS PASSED:", passed);
        if (!passed) process.exitCode = 1;

    } catch (error) {
        console.error("Test failed:", error.message);
        process.exitCode = 1;
    } finally {
        if (testPid !== null) {
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                await client.query(
                    "DELETE FROM stock_reservations WHERE pid = $1",
                    [testPid]
                );

                await client.query(
                    "DELETE FROM products WHERE pid = $1",
                    [testPid]
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

main();
