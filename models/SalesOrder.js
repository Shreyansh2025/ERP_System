const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalesOrder=sequelize.define('SalesOrder',{
     id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true 
},
    order_number:{
        type:DataTypes.STRING
    },
    customer_id :{
        type:DataTypes.INTEGER
    },
    order_date:{
        type:DataTypes.DATE
    },
    subtotal:{
        type:DataTypes.DECIMAL(10,2)
    },
    tax_amount:{
        type:DataTypes.DECIMAL(10,2)
    },
    total_amount:{
        type:DataTypes.DECIMAL(10,2)
    },
    payment_status:{
        type:DataTypes.ENUM('paid','unpaid','partial')
    },
    created_at: {
        type: DataTypes.DATE,defaultValue: DataTypes.NOW
    },
}, {
    tableName: 'SalesOrders',
});
module.exports=SalesOrder
