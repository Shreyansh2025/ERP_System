const { Op } = require('sequelize');
const { Vendor, PurchaseOrder, VendorPayment } = require('../models');

// create new vendor
exports.create = async (req, res) => {
  try {
    const { name, email, phone, address, gst_number, opening_balance } = req.body;
    if (email) {
      const existing = await Vendor.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already taken' });
    }
    const vendor = await Vendor.create({ name, email, phone, address, gst_number, opening_balance });
    res.status(201).json({ message: 'Vendor added', data: vendor });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all vendors 
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
    const { count, rows } = await Vendor.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset), order: [['id', 'DESC']],
    });
    res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get vendor by id
exports.getById = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ data: vendor });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// update vendor details
exports.update = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { email } = req.body;
    if (email && email !== vendor.email) {
      const existing = await Vendor.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already taken' });
    }
    await vendor.update(req.body);
    res.json({ message: 'Updated', data: vendor });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete vendor 
exports.delete = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const orderCount = await PurchaseOrder.count({ where: { vendor_id: vendor.id } });
    const paymentCount = await VendorPayment.count({ where: { vendor_id: vendor.id } });
    if (orderCount > 0 || paymentCount > 0) {
      return res.status(409).json({ message: 'Cant delete, vendor has orders/payments' });
    }
    await vendor.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
