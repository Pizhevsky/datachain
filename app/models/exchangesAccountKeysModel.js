"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const exchangesAccountKeysAttributes = {
	accountId: {
		type: Sequelize.INTEGER,
		field: 'account_id',
		primaryKey: true,
		autoIncrement: true
	},
	key: {
		type: Sequelize.STRING,
		field: 'key'
	},
	secret: {
		type: Sequelize.STRING,
		field: 'secret'
	}
};

const ExchangesAccountKeysModel = dbConnection.define('exchangesAccountKeysModel', exchangesAccountKeysAttributes, {
	tableName: 'exchanges_account_keys'
});

module.exports = {

	findByAccountId: function(id){
		return ExchangesAccountKeysModel
			.findOne({
				where: {'id': id}
			});
	},

	findByExchangeId: function(exchangeId){
		return ExchangesAccountKeysModel
			.findOne({
				where: {'exchange_id': exchangeId}
			});
	}

};
