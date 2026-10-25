
const DiscountService = require(
    "./services/order-service/src/domain/services/DiscountService"
);

console.log(
    "GOLD:",
    DiscountService.calculate(1450000000, "GOLD", 500)
);

console.log(
    "SILVER:",
    DiscountService.calculate(1450000000, "SILVER", 100)
);

console.log(
    "BRONZE:",
    DiscountService.calculate(1450000000, "BRONZE", 0)
);
