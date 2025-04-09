// Load environment variables
require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  {
    dialect: process.env.DB_DIALECT,
    storage: process.env.DB_STORAGE,
  }
);

module.exports = sequelize;
