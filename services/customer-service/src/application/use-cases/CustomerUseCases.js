
const CustomerRepository = require(
    "../../infrastructure/persistence/CustomerRepository"
);

const MembershipRepository = require(
    "../../infrastructure/persistence/MembershipRepository"
);

const customers = new CustomerRepository();
const memberships = new MembershipRepository();

module.exports = {
    getCustomer: (uid) => customers.findByUid(uid),

    createCustomer: (data) => customers.create(data),

    updateCustomer: (uid, data) =>
        customers.update(uid, data),

    getMemberships: () => memberships.findAll(),

    getMembership: (mid) => memberships.findById(mid)
};
