"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const exchangesAccountsAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true,
		autoIncrement: true
	},
	exchangeId: {
		type: Sequelize.INTEGER,
		field: 'exchange_id'
	},
	email: {
		type: Sequelize.STRING,
		field: 'email'
	}
};

const ExchangesAccountsModel = dbConnection.define('exchangesAccountsModel', exchangesAccountsAttributes, {
	tableName: 'exchanges_accounts'
});

module.exports = {

	findByAccountId: function(id){
		return ExchangesAccountsModel
			.findOne({
				where: {'id': id}
			});
	},

	findByExchangeId: function(exchangeId){
		return ExchangesAccountsModel
			.findOne({
				where: {'exchange_id': exchangeId}
			});
	}

};
