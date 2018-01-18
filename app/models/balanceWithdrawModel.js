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
	token: {
		type: Sequelize.STRING,
		field: 'token'
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

	findByWithdrawToken: function(token) {
		return BalanceWithdrawModel
			.findOne({
				where: {'token': token}
			});
	},

	createNew: function(data) {
		return BalanceWithdrawModel
			.create(data);
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
