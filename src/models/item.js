const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Item = sequelize.define("item", {
    item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    category_name: {
      type: DataTypes.STRING,
    },
    photos: { type: DataTypes.JSON },
    item_status: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
  }, { timestamps: true });

  return Item;
};
