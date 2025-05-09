const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define("password_reset_token", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, { timestamps: true });

  return PasswordResetToken;
};