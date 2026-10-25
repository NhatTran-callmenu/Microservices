require("dotenv").config();

const StockClient = require(
    "./src/infrastructure/clients/StockClient"
);

const client = new StockClient();

console.log("Product URL configured:", Boolean(client.baseUrl));
console.log("Internal API Key configured:", Boolean(client.apiKey));
console.log("Reserve method:", typeof client.reserve);
console.log("Release method:", typeof client.release);