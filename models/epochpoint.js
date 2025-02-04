const Sequelize = require('sequelize');

const EpochPoint = {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    points: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: true,
    }
};

module.exports.EpochPoint = EpochPoint;