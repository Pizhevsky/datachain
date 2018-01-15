"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const exchangesAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true,
		autoIncrement: true
	},
	name: {
		type: Sequelize.STRING,
		field: 'name'
	}
};

const ExchangesModel = dbConnection.define('exchangesModel', exchangesAttributes, {
	tableName: 'exchanges'
});

module.exports = {

	findById: function(id){
		return ExchangesModel
			.findOne({
				where: {'id': id}
			});
	},

	findByName: function(name){
		return ExchangesModel
			.findOne({
				where: {'name': name}
			});
	}

};
