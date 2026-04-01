const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VendorPayment = sequelize.define('VendorPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  purchase_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'bank', 'upi', 'cheque'),
    defaultValue: 'cash',
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'vendor_payments',
});

module.exports = VendorPayment;

