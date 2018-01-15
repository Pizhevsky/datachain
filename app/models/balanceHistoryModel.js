"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const balanceHistoryAttributes = {
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
	src: {
		type: Sequelize.ENUM('e', 'a'),
		field: 'src'
	},
	dateTime: {
		type: Sequelize.DATE,
		field: 'date_time'
	}
};

const BalanceHistoryModel = dbConnection.define('balanceHistoryModel', balanceHistoryAttributes, {
	tableName: 'balance_history'
});

module.exports = {

	findByUserId: function(userId){
		return BalanceHistoryModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return BalanceHistoryModel
			.create(data);
	},

	update: function(data) {
		let obj = {};
		obj[data.currency] = data.amount;

		return BalanceHistoryModel
			.update(obj, {
				where: { 'user_id': data.userId }
			});
	}
};
