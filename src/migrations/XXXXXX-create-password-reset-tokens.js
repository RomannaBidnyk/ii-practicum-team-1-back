module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('password_reset_tokens', {
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('password_reset_tokens');
  }
};