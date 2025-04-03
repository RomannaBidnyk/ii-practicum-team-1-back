const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define("category", {
    category_name: { type: DataTypes.STRING, primaryKey: true, allowNull: false }
  }, { timestamps: true });

  return Category;
};
