const { Op } = require('sequelize');
const { Customer, SalesOrder, CustomerPayment } = require('../models');

// create customer payment 
exports.create = async (req, res) => {
    try {
        const { customer_id, sales_order_id, amount, payment_mode, payment_date } = req.body;
        const customer = await Customer.findByPk(customer_id);
        if (!customer) return res.status(404).json({ msg: 'Customer not found' });
        const order = await SalesOrder.findByPk(sales_order_id);
        if (!order) return res.status(404).json({ msg: 'Sales order not found' });
        const alreadyPaid = await CustomerPayment.sum('amount', { where: { sales_order_id } }) || 0;
        const remaining = parseFloat(order.total_amount) - alreadyPaid;
        if (amount > remaining) {
            return res.status(400).json({ msg: `Amount exceeds remaining balance of ₹${remaining.toFixed(2)}` });
        }

        const payment = await CustomerPayment.create({
            customer_id, sales_order_id, amount, payment_mode, payment_date,
        });
        const totalPaid = await CustomerPayment.sum('amount', { where: { sales_order_id } }) || 0;
        const newStatus = totalPaid >= parseFloat(order.total_amount) ? 'paid' : 'partial';
        await order.update({ payment_status: newStatus });

        res.status(201).json({ msg: 'Payment saved', data: payment });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// get all customer payments 
exports.getAll = async (req, res) => {
    try {
        const { customer_id, search, from_date, to_date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (customer_id) where.customer_id = customer_id;
        if (from_date && to_date) {
            where.payment_date = { [Op.between]: [from_date, to_date] };
        } else if (from_date) {
            where.payment_date = { [Op.gte]: from_date };
        } else if (to_date) {
            where.payment_date = { [Op.lte]: to_date };
        }

        if (search) {
            where[Op.or] = [
                { '$customer.name$': { [Op.like]: `%${search}%` } },
                { '$salesOrder.order_number$': { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await CustomerPayment.findAndCountAll({
            where,
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name'] },
                { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'order_number'] },
            ],
            subQuery: false,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['id', 'DESC']],
        });
        res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// get payment summary 
exports.getSummary = async (req, res) => {
    try {
        const { sales_order_id } = req.params;
        const order = await SalesOrder.findByPk(sales_order_id);
        if (!order) return res.status(404).json({ msg: 'Sales order not found' });

        const totalPaid = await CustomerPayment.sum('amount', { where: { sales_order_id } }) || 0;
        const totalAmount = parseFloat(order.total_amount) || 0;
        const remaining = Math.max(0, totalAmount - totalPaid);

        res.json({ total_amount: totalAmount, total_paid: totalPaid, remaining: remaining });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

