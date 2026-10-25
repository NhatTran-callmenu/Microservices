
require("dotenv").config();

const app = require("./app");

const { startGrpcServer } = require(
    "./interfaces/grpc/product.grpc"
);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Product Service running on port ${PORT}`);
});

startGrpcServer();
