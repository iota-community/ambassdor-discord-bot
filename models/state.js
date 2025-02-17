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
    nextEpochRoundTime: {
        type: Sequelize.BIGINT,
    },
    startupTime: {
        type: Sequelize.BIGINT,
    },
    epoch: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
    },
    nextEpochTime: {
        type: Sequelize.BIGINT,
    },
}

module.exports.State = State;