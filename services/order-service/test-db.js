require("dotenv").config();

const pool = require("./src/infrastructure/persistence/database");

async function testConnection() {
    try {
        const connection = await pool.query(
            "SELECT current_database(), current_user"
        );

        console.log("PostgreSQL connected successfully");
        console.log(connection.rows[0]);

        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log("Tables:", tables.rows);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testConnection();