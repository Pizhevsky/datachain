"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const arbitrageHistoryAttributes = {
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
		primaryKey: true
	},
	currency: {
		type: Sequelize.STRING,
		field: 'currency'
	},
	amount: {
		type: Sequelize.FLOAT,
		field: 'amount'
	},
	type: {
		type: Sequelize.ENUM('in', 'out'),
		field: 'type'
	},
	dateTime: {
		type: Sequelize.DATE,
		field: 'date_time'
	}
};

const ArbitrageHistoryModel = dbConnection.define('arbitrageHistoryModel', arbitrageHistoryAttributes, {
	tableName: 'arbitrage_history'
});

module.exports = {

	findByUserId: function(userId){
		return ArbitrageHistoryModel
			.findAll({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return ArbitrageHistoryModel
			.create(data);
	},

	update: function(data) {
		let obj = {};
		obj[data.currency] = data.amount;

		return ArbitrageHistoryModel
			.update(obj, {
				where: { 'user_id': data.userId }
			});
	}
};
