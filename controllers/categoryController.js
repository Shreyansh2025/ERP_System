const { Category, Product } = require('../models');

// create new category
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Category.findOne({ where: { name } });
    if (existing) return res.status(409).json({ message: 'Category name already exists' });

    const category = await Category.create({ name });
    res.status(201).json({ message: 'Category created', data: category });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all categories 
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const { count, rows } = await Category.findAndCountAll({
      order: [['id', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// update category name
exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const { name } = req.body;
    if (name && name !== category.name) {
      const existing = await Category.findOne({ where: { name } });
      if (existing) return res.status(409).json({ message: 'Category name already exists' });
    }

    await category.update({ name });
    res.json({ message: 'Category updated', data: category });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete category if no products 
exports.delete = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(409).json({ message: 'Cant delete, products are using this category' });
    }

    await category.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
