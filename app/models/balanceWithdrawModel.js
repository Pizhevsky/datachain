"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const balanceWithdrawAttributes = {
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
	address: {
		type: Sequelize.STRING,
		field: 'address'
	},
	approved: {
		type: Sequelize.BOOLEAN,
		field: 'approved'
	},
	dateTime: {
		type: Sequelize.DATE,
		field: 'date_time'
	}
};

const BalanceWithdrawModel = dbConnection.define('balanceWithdrawModel', balanceWithdrawAttributes, {
	tableName: 'balance_withdraw'
});

module.exports = {

	findByUserId: function(userId){
		return BalanceWithdrawModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return BalanceHistoryModel
			.create(BalanceWithdrawModel);
	},

	update: function(data) {
		let obj = {};
		obj[data.currency] = data.amount;

		return BalanceWithdrawModel
			.update(obj, {
				where: { 'user_id': data.userId }
			});
	}
};
