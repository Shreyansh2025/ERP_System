const { Op } = require('sequelize');
const { Product, Category, PurchaseOrderItem, SalesOrderItem } = require('../models');

// create new product
exports.create = async(req, res) => {
    try {
        const { name, sku, category_id, purchase_price, sales_price, stock_quantity, description } = req.body;
        const category = await Category.findByPk(category_id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const product = await Product.create({ name, sku, category_id, purchase_price, sales_price, stock_quantity, description });
        res.status(201).json({ message: 'Product added', data: product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// get all products 
exports.getAll = async(req, res) => {
    try {
        const { search, category_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};

        if (search) where.name = {
            [Op.like]: `%${search}%`
        };
        if (category_id) where.category_id = category_id;

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['id', 'DESC']
            ],
        });

        res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// get product by id
exports.getById = async(req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ data: product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// update product
exports.update = async(req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (req.body.category_id) {
            const category = await Category.findByPk(req.body.category_id);
            if (!category) return res.status(404).json({ message: 'Category not found' });
        }

        await product.update(req.body);
        res.json({ message: 'Updated', data: product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// delete product if not used in orders
exports.delete = async(req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const piCount = await PurchaseOrderItem.count({ where: { product_id: product.id } });
        const siCount = await SalesOrderItem.count({ where: { product_id: product.id } });
        if (piCount > 0 || siCount > 0) {
            return res.status(409).json({ message: 'Cant delete, product is used in orders' });
        }

        await product.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};