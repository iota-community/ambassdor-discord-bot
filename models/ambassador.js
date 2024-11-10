const Sequelize = require('sequelize');

// The ambassador model
const Ambassador = {
	id: {
		type: Sequelize.STRING,
		unique: true,
    primaryKey: true,
	},
  displayName: {
    type: Sequelize.STRING,
    unique: true,
  },
  x_user_id: {
    type: Sequelize.STRING,
		unique: true,
    allowNull: true,
  },
  x_access_token: {
    type: Sequelize.STRING,
		unique: true,
    allowNull: true,
  },
  x_screen_name: {
    type: Sequelize.STRING,
		unique: true,
    allowNull: true,
  },
  x_access_secret: {
    type: Sequelize.STRING,
		unique: true,
    allowNull: true,
  },
	tweets: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  points: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  oauth_token: {
    type: Sequelize.STRING,
  },
  oauth_token_secret: {
    type: Sequelize.STRING,
  }
};

module.exports.Ambassador = Ambassador;