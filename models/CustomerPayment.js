const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CustomerPayment = sequelize.define('CustomerPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sales_order_id: {
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
  tableName: 'customer_payments',
});

module.exports = CustomerPayment;

