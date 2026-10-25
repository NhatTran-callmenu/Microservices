
require("dotenv").config();

const pool = require("./src/infrastructure/persistence/database");

async function main() {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database, current_user AS username"
        );

        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log("PostgreSQL connected successfully");
        console.log(result.rows[0]);
        console.log("Tables:", tables.rows);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
