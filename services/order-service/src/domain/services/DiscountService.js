
class DiscountService {
    static getDiscountPercent(membership, score) {
        const points = Number(score);

        if (!Number.isFinite(points) || points < 0) {
            return 0;
        }

        switch (String(membership).toUpperCase()) {
            case "GOLD":
                return points >= 500 ? 10 : 0;

            case "SILVER":
                return points >= 100 ? 5 : 0;

            case "BRONZE":
                return 0;

            default:
                return 0;
        }
    }

    static calculate(subtotalCents, membership, score) {
        const discountPercent =
            this.getDiscountPercent(membership, score);

        const discountCents = Math.round(
            subtotalCents * discountPercent / 100
        );

        return {
            discountPercent,
            subtotalAmount: (subtotalCents / 100).toFixed(2),
            discountAmount: (discountCents / 100).toFixed(2),
            totalAmount: (
                (subtotalCents - discountCents) / 100
            ).toFixed(2)
        };
    }
}

module.exports = DiscountService;
