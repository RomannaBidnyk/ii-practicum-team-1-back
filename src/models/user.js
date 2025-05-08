const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "user",
    {
      email: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      password: { type: DataTypes.STRING, allowNull: false },
      first_name: { type: DataTypes.STRING, allowNull: false },
      last_name: { type: DataTypes.STRING, allowNull: false },
      phone_number: { type: DataTypes.STRING, allowNull: false },
      zip_code: { type: DataTypes.STRING, allowNull: false },
      avatar_url: { type: DataTypes.STRING, allowNull: true },
      avatar_public_id: { type: DataTypes.STRING, allowNull: true },
    },
    { timestamps: true }
  );

  return User;
};
