const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  module_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'modules',
});

module.exports = Module;

