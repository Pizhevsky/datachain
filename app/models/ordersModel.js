"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const ordersAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true,
		autoIncrement: true
	},
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
	},
	exchangeId: {
		type: Sequelize.INTEGER,
		field: 'exchange_id',
	},
	orderId: {
		type: Sequelize.STRING,
		field: 'order_id'
	},
	amount: {
		type: Sequelize.FLOAT,
		field: 'amount'
	},
	price: {
		type: Sequelize.FLOAT,
		field: 'price'
	},
	type: {
		type: Sequelize.STRING,
		field: 'type'
	},
	side: {
		type: Sequelize.STRING,
		field: 'side'
	},
	mixId: {
		type: Sequelize.INTEGER,
		field: 'mix_id'
	},
	fee: {
		type: Sequelize.FLOAT,
		field: 'fee'
	},
	feeCurrency: {
		type: Sequelize.STRING,
		field: 'fee_currency'
	},
	market: {
		type: Sequelize.STRING,
		field: 'market'
	},
	dateTime: {
		type: Sequelize.DATE,
		field: 'date_time'
	}
};

const OrdersModel = dbConnection.define('ordersModel', ordersAttributes, {
	tableName: 'orders'
});

module.exports = {

	findByUserId: function(userId){
		return OrdersModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return OrdersModel
			.create(BalanceWithdrawModel);
	},

	update: function(data) {
		let obj = {};
		obj[data.currency] = data.amount;

		return OrdersModel
			.update(obj, {
				where: { 'user_id': data.userId }
			});
	}
};
