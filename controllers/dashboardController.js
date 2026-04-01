const { Op } = require('sequelize');
const { Customer, Vendor, Category, Product, PurchaseOrder, SalesOrder, CustomerPayment, VendorPayment } = require('../models');

// get dashboard summary counts and totals
exports.getSummary = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const totalVendors = await Vendor.count();
    const totalCategories = await Category.count();
    const totalProducts = await Product.count();
    const totalStockQuantity = await Product.sum('stock_quantity');
    const totalPurchaseOrders = await PurchaseOrder.count();
    const totalSalesOrders = await SalesOrder.count();
    const totalCustomerPayments = await CustomerPayment.count();
    const totalVendorPayments = await VendorPayment.count();
    const customerPaymentsTotal = await CustomerPayment.sum('amount') || 0;
    const vendorPaymentsTotal = await VendorPayment.sum('amount') || 0;
    const lowStockProducts = await Product.findAll({
      where: { stock_quantity: { [Op.lt]: 10 } },
      attributes: ['id', 'name', 'stock_quantity'],
      order: [['stock_quantity', 'ASC']],
      limit: 10,
    });

    res.json({
      counts: {
        customers: totalCustomers,
        vendors: totalVendors,
        categories: totalCategories,
        products: totalProducts,
        purchaseOrders: totalPurchaseOrders,
        salesOrders: totalSalesOrders,
        customerPayments: totalCustomerPayments,
        vendorPayments: totalVendorPayments,
      },
      totals: {
        stockQuantity: Number(totalStockQuantity || 0),
        customerPaymentsAmount: Number(customerPaymentsTotal),
        vendorPaymentsAmount: Number(vendorPaymentsTotal),
      },
      lowStockProducts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
