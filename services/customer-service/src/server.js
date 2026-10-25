
require("dotenv").config();

const app = require("./app");

const { startGrpcServer } = require(
    "./interfaces/grpc/customer.grpc"
);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Customer Service running on port ${PORT}`);
});

startGrpcServer();
