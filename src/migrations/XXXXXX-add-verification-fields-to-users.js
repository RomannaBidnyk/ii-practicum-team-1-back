module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'is_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('users', 'verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('users', 'locked_until', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'is_verified');
    await queryInterface.removeColumn('users', 'verification_token');
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'locked_until');
  }
};