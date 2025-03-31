const { PORT = 8000 } = process.env;
const app = require("./app");
const sequelize = require("./db");
const models = require("./models/models");

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");

    app.listen(PORT, () => {
      console.log(`Listening on Port ${PORT}!`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

start();
