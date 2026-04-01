const { Op } = require('sequelize');
const { SalesOrder, SalesOrderItem, Customer, Product } = require('../models');

// create sales order 
exports.create = async (req, res) => {
    try {
        const { customer_id, order_date, items } = req.body;
        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ msg: 'customer not found' });
        }

        // check stock availability 
        for (const item of items) {
            const product = await Product.findByPk(item.product_id);
            if (!product) {
                return res.status(404).json({ msg: `Product with id ${item.product_id} not found` });
            }
            if (item.quantity > product.stock_quantity) {
                return res.status(400).json({ msg: `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}` });
            }
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

        const salesOrder = await SalesOrder.create({
            order_number: 'TEMP', customer_id, order_date, subtotal, tax_amount, total_amount, payment_status: 'unpaid',
        });

        await salesOrder.update({ order_number: 'SO-' + salesOrder.id });
        for (const item of items) {
            await SalesOrderItem.create({
                sales_order_id: salesOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                total: item.total,
            });
            await Product.decrement('stock_quantity', { by: item.quantity, where: { id: item.product_id } });
        }

        res.status(201).json({ msg: 'SalesOrder created', data: salesOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};

// get all sales orders 
exports.getAll = async (req, res) => {
    try {
        const { search, customer_id, payment_status, from_date, to_date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (customer_id) where.customer_id = customer_id;
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
        const { count, rows } = await SalesOrder.findAndCountAll({
            where,
            include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }],
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

// gets sales order by id
exports.getById = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findByPk(req.params.id, {
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name'] },
                { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
            ],
        });
        if (!salesOrder) {
            return res.status(404).json({ msg: 'not found' });
        }
        res.json({ data: salesOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};

// delete sales order 
exports.delete = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findByPk(req.params.id, {
            include: [{ model: SalesOrderItem, as: 'items' }],
        });
        if (!salesOrder) {
            return res.status(404).json({ msg: 'not found' });
        }
        for (const item of salesOrder.items) {
            await Product.increment('stock_quantity', { by: item.quantity, where: { id: item.product_id } });
        }

        await salesOrder.destroy();
        res.status(200).json({ msg: 'deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'server error' });
    }
};
