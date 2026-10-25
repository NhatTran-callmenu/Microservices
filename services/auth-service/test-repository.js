
const UserRepository = require(
    "./src/infrastructure/persistence/UserRepository"
);

const pool = require(
    "./src/infrastructure/persistence/database"
);

async function testRepository() {
    const repository = new UserRepository();

    try {
        const role = await repository.findRoleByName("CUSTOMER");
        console.log("CUSTOMER Role:", role);

        const user = await repository.findByUsername("demo");
        console.log("Demo User:", user);
    } catch (error) {
        console.error("Repository Test Error:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testRepository();
