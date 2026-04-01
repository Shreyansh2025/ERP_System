const { Op } = require('sequelize');
const { Vendor, PurchaseOrder, VendorPayment } = require('../models');

// create vendor payment 
exports.create = async (req, res) => {
    try {
        const { vendor_id, purchase_order_id, amount, payment_mode, payment_date } = req.body;
        const vendor = await Vendor.findByPk(vendor_id);
        if (!vendor) return res.status(404).json({ msg: 'Vendor not found' });
        const order = await PurchaseOrder.findByPk(purchase_order_id);
        if (!order) return res.status(404).json({ msg: 'Purchase order not found' });
        const alreadyPaid = await VendorPayment.sum('amount', { where: { purchase_order_id } }) || 0;
        const remaining = parseFloat(order.total_amount) - alreadyPaid;
        if (amount > remaining) {
            return res.status(400).json({ msg: `Amount exceeds remaining balance of ₹${remaining.toFixed(2)}` });
        }

        const payment = await VendorPayment.create({
            vendor_id, purchase_order_id, amount, payment_mode, payment_date,
        });
        const totalPaid = await VendorPayment.sum('amount', { where: { purchase_order_id } }) || 0;
        const newStatus = totalPaid >= parseFloat(order.total_amount) ? 'paid' : 'partial';
        await order.update({ payment_status: newStatus });

        res.status(201).json({ msg: 'Payment saved', data: payment });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// get all vendor payments 
exports.getAll = async (req, res) => {
    try {
        const { vendor_id, search, from_date, to_date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (vendor_id) where.vendor_id = vendor_id;
        if (from_date && to_date) {
            where.payment_date = { [Op.between]: [from_date, to_date] };
        } else if (from_date) {
            where.payment_date = { [Op.gte]: from_date };
        } else if (to_date) {
            where.payment_date = { [Op.lte]: to_date };
        }
        if (search) {
            where[Op.or] = [
                { '$vendor.name$': { [Op.like]: `%${search}%` } },
                { '$purchaseOrder.order_number$': { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await VendorPayment.findAndCountAll({
            where,
            include: [
                { model: Vendor, as: 'vendor', attributes: ['id', 'name'] },
                { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'order_number'] },
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
        const { purchase_order_id } = req.params;
        const order = await PurchaseOrder.findByPk(purchase_order_id);
        if (!order) return res.status(404).json({ msg: 'Purchase order not found' });

        const totalPaid = await VendorPayment.sum('amount', { where: { purchase_order_id } }) || 0;
        const totalAmount = parseFloat(order.total_amount) || 0;
        const remaining = Math.max(0, totalAmount - totalPaid);

        res.json({ total_amount: totalAmount, total_paid: totalPaid, remaining: remaining });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

