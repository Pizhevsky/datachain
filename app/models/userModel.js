"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userAttributes = {
	id: {
		type: Sequelize.INTEGER,
		field: 'id',
		primaryKey: true,
		autoIncrement: true
	},
	email: {
		type: Sequelize.STRING,
		field: 'email',
		validate: {
			isEmail: true
		}
	},
	password: {
		type: Sequelize.STRING,
		field: 'password',
		allowNull: false
	},
	referalGuid: {
		type: Sequelize.STRING,
		field: 'referal_guid',
		allowNull: false
	},
	loginAttempts: {
		type: Sequelize.INTEGER,
		field: 'login_attempts'
	}
};

const UserModel = dbConnection.define('userModel', userAttributes, {
	tableName: 'users'
});

module.exports = {

	getAll: function() {
		return UserModel.findAll();
	},

	findByUserId: function(userId){
		return UserModel
			.findOne({
				where: {'id': userId}
			});
	},

	findByUserEmail: function(email){
		return UserModel
			.findOne({
				where: {'email': email}
			});
	},

	findByReferalGuid: function(referalGuid){
		return UserModel
			.findOne({
				where: {'referal_guid': referalGuid}
			});
	},

	createNew: function(data){
		return UserModel
			.create(data);
	},

	updatePassword: function(data) {
		return UserModel
			.update({
				password: data.password
			},{
				where: { 'id': data.userId }
			});
	},

	updateAttempts: function(data) {
		return UserModel
			.update({
				loginAttempts: data.num
			},{
				where: { 'id': data.userId }
			});
	}

};
