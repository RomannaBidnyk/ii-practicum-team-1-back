require("dotenv").config();
const { PORT = 8000 } = process.env;
const app = require("./app");
const { sequelize } = require("./models");

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    await sequelize.sync({ alter: true });
    console.log("Models synced successfully.");

    app.listen(PORT, () => {
      console.log(`Listening on Port ${PORT}!`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

start();
