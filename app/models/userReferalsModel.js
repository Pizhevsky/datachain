"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userReferalsAttributes = {
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
		primaryKey: true
	},
	referalId: {
		type: Sequelize.STRING,
		field: 'referal_id'
	}
};

const UserReferalsModel = dbConnection.define('userReferalsModel', userReferalsAttributes, {
	tableName: 'user_referals'
});

module.exports = {

	findByUserId: function(userId){
		return UserReferalsModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	findByReferalId: function(referalId) {
		return UserReferalsModel
			.findOne({
				where: {'referal_id': referalId}
			});
	},

	getAllReferals: function(userId){
		return UserReferalsModel
			.findAll({
				where: {'user_id': userId}
			});
	},

	createNew: function(data) {
		return UserReferalsModel
			.create(data);
	}
};
