const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  address: {
    type: DataTypes.TEXT,
  },
  gst_number: {
    type: DataTypes.STRING(20),
  },
  opening_balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'customers',
});

module.exports = Customer;
