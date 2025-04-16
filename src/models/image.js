const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Image = sequelize.define(
    "image",
    {
      public_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return Image;
};
