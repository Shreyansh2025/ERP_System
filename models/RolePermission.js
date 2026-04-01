const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  can_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  can_create: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  can_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  can_delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'permissions',
});

module.exports = Permission;

