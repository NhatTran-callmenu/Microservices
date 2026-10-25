
require("dotenv").config();

const CustomerGrpcClient = require(
    "./src/infrastructure/clients/CustomerGrpcClient"
);

const client = new CustomerGrpcClient();

async function main() {
    try {
        const customer = await client.getCustomer(1);
        const membership = await client.getMembership(1);

        console.log("CUSTOMER:", customer);
        console.log("MEMBERSHIP:", membership);

        const passed =
            customer !== null &&
            customer.uid === 1 &&
            membership !== null &&
            membership.mname === "GOLD" &&
            membership.score === 500;

        console.log(
            "ALL CUSTOMER gRPC TESTS PASSED:",
            passed
        );

        if (!passed) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error(
            "CUSTOMER gRPC ERROR:",
            error.message
        );

        process.exitCode = 1;
    } finally {
        client.close();
    }
}

main();
