const { Op } = require('sequelize');
const { Customer, SalesOrder, CustomerPayment } = require('../models');

// create new customer
exports.create = async (req, res) => {
  try {
    const { name, email, phone, address, gst_number, opening_balance } = req.body;
    if (email) {
      const existing = await Customer.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already exists' });
    }
    const customer = await Customer.create({ name, email, phone, address, gst_number, opening_balance });
    res.status(201).json({ message: 'Customer added', data: customer });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all customers 
exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Customer.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset), order: [['id', 'DESC']],
    });
    res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get customer by id
exports.getById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ data: customer });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// update customer 
exports.update = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const { email } = req.body;
    if (email && email !== customer.email) {
      const existing = await Customer.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already exists' });
    }
    await customer.update(req.body);
    res.json({ message: 'Updated', data: customer });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete customer if no orders or payments
exports.delete = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const orderCount = await SalesOrder.count({ where: { customer_id: customer.id } });
    const paymentCount = await CustomerPayment.count({ where: { customer_id: customer.id } });
    if (orderCount > 0 || paymentCount > 0) {
      return res.status(409).json({ message: 'Cant delete, customer has orders/payments' });
    }
    await customer.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
