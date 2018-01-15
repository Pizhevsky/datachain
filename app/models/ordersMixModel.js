"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const ordersMixAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true,
		autoIncrement: true
	},
	orders: {
		type: Sequelize.JSON,
		field: 'orders'
	}
};

const OrdersMixModel = dbConnection.define('ordersMixModel', ordersMixAttributes, {
	tableName: 'orders_mix'
});

module.exports = {

	findById: function(id){
		return OrdersMixModel
			.findOne({
				where: {'id': id}
			});
	},

	createNew: function(data){
		return OrdersMixModel
			.create(data);
	}

};
