const Sequelize = require('sequelize');

// The ambassador model
const Ambassador = {
	id: {
		type: Sequelize.STRING,
		unique: true,
    primaryKey: true,
	},
  tweeter_id: {
    type: Sequelize.STRING,
		unique: true,
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
};

module.exports.Ambassador = Ambassador;