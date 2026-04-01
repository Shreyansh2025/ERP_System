const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const Module = require('./Module');
const Permission = require('./RolePermission');
const Customer = require('./Customer');
const Vendor = require('./Vendor');
const Category = require('./Category');
const Product = require('./Product');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const SalesOrder = require('./SalesOrder');
const SalesOrderItem = require('./SalesOrderItem');
const CustomerPayment = require('./CustomerPayment');
const VendorPayment = require('./VendorPayment');

// setting up relations between models

// Role & Permission & Module associations
Role.hasMany(Permission, { foreignKey: 'role_id', as: 'permissions', onDelete: 'CASCADE' });
Permission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

Module.hasMany(Permission, { foreignKey: 'module_id', as: 'permissions', onDelete: 'CASCADE' });
Permission.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User permissions (user_id nullable — null = role template/defaults, set = user's own complete permissions)
User.hasMany(Permission, { foreignKey: 'user_id', as: 'userPermissions', onDelete: 'CASCADE' });
Permission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Vendor.hasMany(PurchaseOrder,{foreignKey:'vendor_id',as:'purchaseOrder'});
PurchaseOrder.belongsTo(Vendor,{foreignKey:'vendor_id',as:'vendor'})

PurchaseOrder.hasMany(PurchaseOrderItem,{foreignKey:'purchase_order_id',as:'items',onDelete:'CASCADE'})
PurchaseOrderItem.belongsTo(PurchaseOrder,{foreignKey:'purchase_order_id',as:'purchaseOrder'})

Product.hasMany(PurchaseOrderItem,{foreignKey:'product_id',as:'purchaseItems'})
PurchaseOrderItem.belongsTo(Product,{foreignKey:'product_id',as:'product'})

Customer.hasMany(SalesOrder,{foreignKey:'customer_id',as:'salesOrder'})
SalesOrder.belongsTo(Customer,{foreignKey:'customer_id',as:'customer'})

SalesOrder.hasMany(SalesOrderItem,{foreignKey:'sales_order_id',as:'items',onDelete:'CASCADE'})
SalesOrderItem.belongsTo(SalesOrder,{foreignKey:'sales_order_id',as:'salesOrder'})

Product.hasMany(SalesOrderItem,{foreignKey:'product_id',as:'salesItems'})
SalesOrderItem.belongsTo(Product,{foreignKey:'product_id',as:'product'})

Customer.hasMany(CustomerPayment,{foreignKey:'customer_id',as:'payments'})
CustomerPayment.belongsTo(Customer,{foreignKey:'customer_id',as:'customer'})

SalesOrder.hasMany(CustomerPayment,{foreignKey:'sales_order_id',as:'payments'})
CustomerPayment.belongsTo(SalesOrder,{foreignKey:'sales_order_id',as:'salesOrder'})

Vendor.hasMany(VendorPayment,{foreignKey:'vendor_id',as:'payments'})
VendorPayment.belongsTo(Vendor,{foreignKey:'vendor_id',as:'vendor'})

PurchaseOrder.hasMany(VendorPayment,{foreignKey:'purchase_order_id',as:'payments'})
VendorPayment.belongsTo(PurchaseOrder,{foreignKey:'purchase_order_id',as:'purchaseOrder'})

module.exports = {
  sequelize,
  User,
  Role,
  Module,
  Permission,
  Customer,
  Vendor,
  Category,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  CustomerPayment,
  VendorPayment,
};
