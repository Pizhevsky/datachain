"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userArbitrageAttributes = {
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
		primaryKey: true
	},
	abx: {
		type: Sequelize.FLOAT,
		field: 'abx'
	},
	btc: {
		type: Sequelize.FLOAT,
		field: 'btc'
	},
	eth: {
		type: Sequelize.FLOAT,
		field: 'eth'
	},
	usd: {
		type: Sequelize.FLOAT,
		field: 'usd'
	},
	usdt: {
		type: Sequelize.FLOAT,
		field: 'usdt'
	},
	xrp: {
		type: Sequelize.FLOAT,
		field: 'xrp'
	}
};

const UserArbitrageModel = dbConnection.define('userArbitrageModel', userArbitrageAttributes, {
	tableName: 'user_arbitrage'
});

module.exports = {

	findByUserId: function(userId){
		return UserArbitrageModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return UserArbitrageModel
			.create(data);
	},

	update: function(userId, data) {
		console.log('Arbitrage update:', userId, data);
		return UserArbitrageModel
			.update(data, {
				where: { 'user_id': userId }
			});
	}
};
