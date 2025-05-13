module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "google_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "google_id");
  },
};
