
const DiscountService = require(
    "./src/domain/services/DiscountService"
);

const subtotalCents = 1450000000;

const cases = [
    { membership: "BRONZE", score: 0 },
    { membership: "SILVER", score: 100 },
    { membership: "GOLD", score: 500 }
];

for (const item of cases) {
    const result = DiscountService.calculate(
        subtotalCents,
        item.membership,
        item.score
    );

    console.log(item.membership, result);
}
