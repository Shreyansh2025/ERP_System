const { Customer, Vendor, SalesOrder, PurchaseOrder, CustomerPayment, VendorPayment } = require('../models');

// get customer ledger 
exports.getCustomerLedger = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ msg: 'Customer not found' });

        const orders = await SalesOrder.findAll({
            where: { customer_id: req.params.id },
            attributes: ['id', 'order_number', 'order_date', 'total_amount'],
            order: [['order_date', 'ASC'], ['id', 'ASC']],
        });

        const payments = await CustomerPayment.findAll({
            where: { customer_id: req.params.id },
            attributes: ['id', 'amount', 'payment_mode', 'payment_date'],
            order: [['payment_date', 'ASC'], ['id', 'ASC']],
        });

        const transactions = [];
        for (const o of orders) {
            transactions.push({
                date: o.order_date,
                type: 'order',
                reference: o.order_number,
                debit: parseFloat(o.total_amount),
                credit: 0,
            });
        }
        for (const p of payments) {
            transactions.push({
                date: p.payment_date,
                type: 'payment',
                reference: `Payment (${p.payment_mode})`,
                debit: 0,
                credit: parseFloat(p.amount),
            });
        }

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        const openingBal = parseFloat(customer.opening_balance) || 0;
        let balance = openingBal;
        const ledger = transactions.map(t => {
            balance += t.debit - t.credit;
            return { ...t, balance };
        });

        res.json({
            customer: { id: customer.id, name: customer.name },
            opening_balance: openingBal,
            transactions: ledger,
            closing_balance: balance,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// get vendor ledger 
exports.getVendorLedger = async (req, res) => {
    try {
        const vendor = await Vendor.findByPk(req.params.id);
        if (!vendor) return res.status(404).json({ msg: 'Vendor not found' });

        const orders = await PurchaseOrder.findAll({
            where: { vendor_id: req.params.id },
            attributes: ['id', 'order_number', 'order_date', 'total_amount'],
            order: [['order_date', 'ASC'], ['id', 'ASC']],
        });

        const payments = await VendorPayment.findAll({
            where: { vendor_id: req.params.id },
            attributes: ['id', 'amount', 'payment_mode', 'payment_date'],
            order: [['payment_date', 'ASC'], ['id', 'ASC']],
        });

        const transactions = [];
        for (const o of orders) {
            transactions.push({
                date: o.order_date,
                type: 'order',
                reference: o.order_number,
                debit: parseFloat(o.total_amount),
                credit: 0,
            });
        }
        for (const p of payments) {
            transactions.push({
                date: p.payment_date,
                type: 'payment',
                reference: `Payment (${p.payment_mode})`,
                debit: 0,
                credit: parseFloat(p.amount),
            });
        }

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        const openingBal = parseFloat(vendor.opening_balance) || 0;
        let balance = openingBal;
        const ledger = transactions.map(t => {
            balance += t.debit - t.credit;
            return { ...t, balance };
        });

        res.json({
            vendor: { id: vendor.id, name: vendor.name },
            opening_balance: openingBal,
            transactions: ledger,
            closing_balance: balance,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
