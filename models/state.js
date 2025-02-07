const Sequelize = require('sequelize');

const State = {
    id: {
        type: Sequelize.INTEGER,
		unique: true,
        primaryKey: true,
    },
    baselinePointsTime: {
        type: Sequelize.BIGINT,
    },
    epochWinner: {
        type: Sequelize.STRING,
    },
    nextEpochTime: {
        type: Sequelize.BIGINT,
    },
    startupTime: {
        type: Sequelize.BIGINT,
    }
}

module.exports.State = State;