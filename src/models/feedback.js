const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Feedback = sequelize.define("feedback", {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    giver_user_email: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    receiver_user_email: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT },
  }, { timestamps: true });

  return Feedback;
};
