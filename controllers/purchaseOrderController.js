const { Op } = require('sequelize');
const { PurchaseOrder, PurchaseOrderItem, Vendor, Product } = require('../models');

// create purchase order 
exports.create = async (req, res) => {
    try {
        const { vendor_id, order_date, items } = req.body;
        const vendor = await Vendor.findByPk(vendor_id);
        if (!vendor) {
            return res.status(404).json({ msg: 'vendor not found' });
        }

        let subtotal = 0;
        let totalTax = 0;
        for (let i = 0; i < items.length; i++) {
            const lineTotal = parseFloat((items[i].quantity * items[i].price).toFixed(2));
            const taxRate = parseFloat(items[i].tax_rate) || 0;
            const taxAmt = parseFloat((lineTotal * taxRate / 100).toFixed(2));
            items[i].tax_rate = taxRate;
            items[i].tax_amount = taxAmt;
            items[i].total = parseFloat((lineTotal + taxAmt).toFixed(2));
            subtotal += lineTotal;
            totalTax += taxAmt;
        }
        subtotal = parseFloat(subtotal.toFixed(2));
        const tax_amount = parseFloat(totalTax.toFixed(2));
        const total_amount = parseFloat((subtotal + tax_amount).toFixed(2));

        const purchaseOrder = await PurchaseOrder.create({
            order_number: 'TEMP', vendor_id, order_date, subtotal, tax_amount, total_amount, payment_status: 'unpaid',
        });

        await purchaseOrder.update({ order_number: 'PO-' + purchaseOrder.id });
        for (const item of items) {
            await PurchaseOrderItem.create({
                purchase_order_id: purchaseOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                total: item.total,
            });
            await Product.increment('stock_quantity', { by: item.quantity, where: { id: item.product_id } });
        }

        res.status(201).json({ msg: 'PurchaseOrder created', data: purchaseOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};

// get all purchase orders 
exports.getAll = async (req, res) => {
    try {
        const { search, vendor_id, payment_status, from_date, to_date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (vendor_id) where.vendor_id = vendor_id;
        if (payment_status) where.payment_status = payment_status;
        if (from_date && to_date) {
            where.order_date = { [Op.between]: [from_date, to_date] };
        } else if (from_date) {
            where.order_date = { [Op.gte]: from_date };
        } else if (to_date) {
            where.order_date = { [Op.lte]: to_date };
        }
        if (search) {
            where[Op.or] = [
                { order_number: { [Op.like]: `%${search}%` } },
            ];
        }
        const { count, rows } = await PurchaseOrder.findAndCountAll({
            where,
            include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['id', 'DESC']],
        });
        res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};

// get purchase order by id
exports.getById = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
            include: [
                { model: Vendor, as: 'vendor', attributes: ['id', 'name'] },
                { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
            ],
        });
        if (!purchaseOrder) {
            return res.status(404).json({ msg: 'not found' });
        }
        res.json({ data: purchaseOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};

// delete purchase order 
exports.delete = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
            include: [{ model: PurchaseOrderItem, as: 'items' }],
        });
        if (!purchaseOrder) {
            return res.status(404).json({ msg: 'not found' });
        }
        for (const item of purchaseOrder.items) {
            await Product.decrement('stock_quantity', { by: item.quantity, where: { id: item.product_id } });
        }

        await purchaseOrder.destroy();
        res.status(200).json({ msg: 'deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};
