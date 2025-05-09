const sequelize = require("../config/db");

const User = require("./user")(sequelize);
const Category = require("./category")(sequelize);
const Item = require("./item")(sequelize);
const Transaction = require("./transaction")(sequelize);
const Feedback = require("./feedback")(sequelize);
const Image = require("./image")(sequelize);
const PasswordResetToken = require("./passwordResetToken")(sequelize);

// Relations

User.hasMany(Item, { foreignKey: "user_email" });
Item.belongsTo(User, { foreignKey: "user_email" });

Category.hasMany(Item, { foreignKey: "category_name" });
Item.belongsTo(Category, { foreignKey: "category_name" });

User.hasMany(Transaction, { foreignKey: "giver_user_email" });
User.hasMany(Transaction, { foreignKey: "receiver_user_email" });
Transaction.belongsTo(User, { foreignKey: "giver_user_email" });
Transaction.belongsTo(User, { foreignKey: "receiver_user_email" });

Item.hasOne(Transaction, { foreignKey: "item_id" });
Transaction.belongsTo(Item, { foreignKey: "item_id" });

User.hasMany(Feedback, { foreignKey: "giver_user_email" });
User.hasMany(Feedback, { foreignKey: "receiver_user_email" });
Feedback.belongsTo(User, { foreignKey: "giver_user_email" });
Feedback.belongsTo(User, { foreignKey: "receiver_user_email" });

Item.hasMany(Feedback, { foreignKey: "item_id" });
Feedback.belongsTo(Item, { foreignKey: "item_id" });

Item.hasMany(Image, { foreignKey: "item_id", onDelete: "CASCADE" });
Image.belongsTo(Item, { foreignKey: "item_id" });

module.exports = {
  sequelize,
  User,
  Category,
  Item,
  Transaction,
  Feedback,
  Image,
  PasswordResetToken,
};
