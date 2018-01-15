"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const arbitrageWithdrawAttributes = {
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

const ArbitrageWithdrawModel = dbConnection.define('arbitrageWithdrawModel', arbitrageWithdrawAttributes, {
	tableName: 'arbitrage_withdraw'
});

module.exports = {

	findByUserId: function(userId){
		return ArbitrageWithdrawModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return ArbitrageWithdrawModel
			.create(data);
	},

	update: function(data) {
		let obj = {};
		obj[data.currency] = data.amount;

		return ArbitrageWithdrawModel
			.update(obj, {
				where: { 'user_id': data.userId }
			});
	}
};
