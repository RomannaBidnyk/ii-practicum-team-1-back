const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Transaction = sequelize.define("transaction", {
    giver_user_email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    receiver_user_email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    item_status: { type: DataTypes.STRING, allowNull: false },
  }, { timestamps: true });

  return Transaction;
};
