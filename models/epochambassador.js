const Sequelize = require('sequelize');

// Store ambassador's earned points per epoch. Epoch duration is 3 days.
const EpochAmbassador = {
  epochNumber: {
    type: Sequelize.INTEGER,
    unique: false,
    primaryKey: false,
  },
  points: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  ambassadorId: {
    type: Sequelize.STRING,
    unique: false,
    primaryKey: false,
  },
  ambassadorDisplayName: {
    type: Sequelize.STRING,
    unique: false,
  },
};

module.exports.EpochAmbassador = EpochAmbassador;
