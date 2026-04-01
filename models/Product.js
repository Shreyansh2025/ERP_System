const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    sku: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
    },
    purchase_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    sales_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'products',
});

module.exports = Product;