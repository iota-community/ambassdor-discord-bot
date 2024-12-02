const Sequelize = require('sequelize');

const TopPoint = {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    points: {
        type: Sequelize.INTEGER  // Updated to INTEGER for compatibility
    },
    authorId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}

module.exports.TopPoint = TopPoint;
