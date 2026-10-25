
const pool = require("./database");

class MembershipRepository {
    async findAll() {
        const result = await pool.query(
            "SELECT * FROM memberships ORDER BY mid"
        );

        return result.rows;
    }

    async findById(mid) {
        const result = await pool.query(
            "SELECT * FROM memberships WHERE mid = $1",
            [mid]
        );

        return result.rows[0] || null;
    }
}

module.exports = MembershipRepository;
