
const pool = require("./src/infrastructure/persistence/database");

async function testConnection() {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database, current_user AS username"
        );

        console.log("PostgreSQL connected successfully");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testConnection();
