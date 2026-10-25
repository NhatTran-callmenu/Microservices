
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const protoPath = path.resolve(
    __dirname,
    "../../../../../protos/customer.proto"
);

const definition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true
});

const customerProto =
    grpc.loadPackageDefinition(definition).customer;

class CustomerGrpcClient {
    constructor() {
        const host =
            process.env.CUSTOMER_GRPC_HOST ||
            "localhost:50052";

        this.client = new customerProto.CustomerService(
            host,
            grpc.credentials.createInsecure()
        );
    }

    request(method, data) {
        return new Promise((resolve, reject) => {
            this.client[method](
                data,
                { deadline: Date.now() + 5000 },
                (error, response) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(response);
                }
            );
        });
    }

    async getCustomer(uid) {
        try {
            return await this.request(
                "GetCustomer",
                { uid: Number(uid) }
            );
        } catch (error) {
            if (error.code === grpc.status.NOT_FOUND) {
                return null;
            }

            throw error;
        }
    }

    async getMembership(uid) {
        try {
            return await this.request(
                "GetMembership",
                { uid: Number(uid) }
            );
        } catch (error) {
            if (error.code === grpc.status.NOT_FOUND) {
                return null;
            }

            throw error;
        }
    }

    close() {
        this.client.close();
    }
}

module.exports = CustomerGrpcClient;
