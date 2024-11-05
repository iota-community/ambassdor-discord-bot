const Sequelize = require('sequelize');

const Message = {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    createdTimestamp: {
        type: Sequelize.BIGINT,  // Updated to BIGINT
        allowNull: true,
    },
    authorId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    points: {
        type: Sequelize.INTEGER  // Updated to INTEGER for compatibility
    }
}

module.exports.Message = Message;
