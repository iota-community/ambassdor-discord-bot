const Sequelize = require('sequelize');

// The Ambassador model
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
  },
  referral_code: {
    type: Sequelize.STRING,
    unique: true,
  },
  referrer: {
    type: Sequelize.STRING,
    defaultValue: 0,
  },
  intermediate_points_redeemed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  advanced_points_redeemed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  }
};

module.exports.Ambassador = Ambassador;