const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const User = sequelize.define(
  "user",
  {
    email: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    password: { type: DataTypes.STRING, unique: true, allowNull: false },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    phone_number: { type: DataTypes.INTEGER, allowNull: false },
    zip_code: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
  }
);

const Category = sequelize.define(
  "category",
  {
    category_name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

const Item = sequelize.define(
  "item",
  {
    item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "email",
      },
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    category_name: {
      type: DataTypes.STRING,
      references: {
        model: Category,
        key: "category_name",
      },
    },
    photos: { type: DataTypes.JSON },
    item_status: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
  }
);

const Transaction = sequelize.define(
  "transaction",
  {
    giver_user_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiver_user_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_status: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
  }
);

const Feedback = sequelize.define(
  "feedback",
  {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "items",
        key: "item_id",
      },
    },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT },
    giver_user_email: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: {
        model: "users",
        key: "email",
      },
    },
    receiver_user_email: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: {
        model: "users",
        key: "email",
      },
    },
  },
  {
    timestamps: true,
  }
);

//Relations

// A User can have many items
User.hasMany(Item, { foreignKey: "user_email" });
Item.belongsTo(User, { foreignKey: "user_email" });

// A Category can have many items
Category.hasMany(Item, { foreignKey: "category_name" });
Item.belongsTo(Category, { foreignKey: "category_name" });

// A User can have many transactions as a giver
User.hasMany(Transaction, { foreignKey: "giver_user_email" });
Transaction.belongsTo(User, { foreignKey: "giver_user_email" });

// A User can have many transactions as a receiver
User.hasMany(Transaction, { foreignKey: "receiver_user_email" });
Transaction.belongsTo(User, { foreignKey: "receiver_user_email" });

// An Item can have one transaction
Item.hasOne(Transaction, { foreignKey: "item_id" });
Transaction.belongsTo(Item, { foreignKey: "item_id" });

// A User can give many feedbacks
User.hasMany(Feedback, { foreignKey: "giver_user_email" });
Feedback.belongsTo(User, { foreignKey: "giver_user_email" });

// A User can receive many feedbacks
User.hasMany(Feedback, { foreignKey: "receiver_user_email" });
Feedback.belongsTo(User, { foreignKey: "receiver_user_email" });

// An Item can have many feedbacks
Item.hasMany(Feedback, { foreignKey: "item_id" });
Feedback.belongsTo(Item, { foreignKey: "item_id" });

module.exports = { User, Category, Item, Transaction, Feedback };
