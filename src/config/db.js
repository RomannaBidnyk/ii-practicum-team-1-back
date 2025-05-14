require("dotenv").config();
const { Sequelize } = require("sequelize");

const env = process.env.NODE_ENV || "development";

const baseConfig = {
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const config = {
  development: {
    ...baseConfig,
    logging: console.log,
  },
  production: {
    ...baseConfig,
    logging: false,
  },
  test: {
    ...baseConfig,
    logging: false,
    database: process.env.TEST_DB_NAME || "test_db",
  },
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  config[env]
);

module.exports = sequelize;
