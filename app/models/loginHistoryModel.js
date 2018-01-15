"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const loginHistoryAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true
	},
	email: {
		type: Sequelize.STRING,
		field: 'email'
	},
	date: {
		type: Sequelize.DATE,
		field: 'date'
	},
	loginIp: {
		type: Sequelize.STRING,
		field: 'ip'
	},
	device: {
		type: Sequelize.STRING,
		field: 'device'
	},
	failed: {
		type: Sequelize.BOOLEAN,
		field: 'failed'
	}
};

const loginHistoryModel = dbConnection.define('loginHistoryModel', loginHistoryAttributes, {
	tableName: 'login_history'
});

module.exports = {

	findLastByEmail: function(email){
		return loginHistoryModel
			.findOne({
				where: { email: email },
				order: [ [ 'id', 'DESC' ]]
			});
	},

	createNew: function(data){
		return loginHistoryModel
			.create(data);
	}

};
