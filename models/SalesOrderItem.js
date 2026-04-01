const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalesOrderItem=sequelize.define('SalesOrderItem',{
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true 
},
    sales_order_id:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    product_id:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    quantity:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull:false
    },
    tax_rate:{
        type:DataTypes.DECIMAL(5,2),
        defaultValue: 0
    },
    tax_amount:{
        type:DataTypes.DECIMAL(10,2),
        defaultValue: 0
    },
    total:{
        type:DataTypes.DECIMAL(12,2),
        allowNull:false
    },
}, {
    tableName: 'SalesOrderItems',
});
module.exports=SalesOrderItem

