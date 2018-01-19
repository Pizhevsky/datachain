"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const arbitrageProfitAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true
	},
	profit: {
		type: Sequelize.INTEGER,
		field: 'profit'
	},
	date: {
		type: Sequelize.DATE,
		field: 'date'
	}
};

const ArbitrageProfitModel = dbConnection.define('arbitrageProfitModel', arbitrageProfitAttributes, {
	tableName: 'arbitrage_profit'
});

module.exports = {

	getProfitByDate: function(date){
		return ArbitrageProfitModel
			.findOne({
				where: {'date': date}
			});
	},

	getProfit: function(){
		return ArbitrageProfitModel
			.findAll();
	}

};
