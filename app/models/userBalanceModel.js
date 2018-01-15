"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userBalanceAttributes = {
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

const UserBalanceModel = dbConnection.define('userBalanceModel', userBalanceAttributes, {
	tableName: 'user_balance'
});

module.exports = {

	findByUserId: function(userId){
		return UserBalanceModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return UserBalanceModel
			.create(data);
	},

	update: function(userId, data) {
		console.log('Balance update:', userId, data);
		return UserBalanceModel
			.update(data, {
				where: { 'user_id': userId }
			});
	}
};
