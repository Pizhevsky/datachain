"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userActivationAttributes = {
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
		primaryKey: true
	},
	activationToken: {
		type: Sequelize.STRING,
		field: 'activate_token'
	},
	activationDate: {
		type: Sequelize.DATE,
		field: 'activate_date'
	},
	secretKey: {
		type: Sequelize.STRING,
		field: 'secret_key'
	},
	secretActive: {
		type: Sequelize.BOOLEAN,
		field: 'secret_active'
	},
	secretAttempts: {
		type: Sequelize.INTEGER,
		field: 'secret_attempts'
	},
	forgotToken: {
		type: Sequelize.STRING,
		field: 'forgot_password_token'
	},
	forgotExpired: {
		type: Sequelize.DATE,
		field: 'forgot_password_expired'
	},
	phoneCode: {
		type: Sequelize.INTEGER,
		field: 'phone_code'
	},
	codeExpired: {
		type: Sequelize.DATE,
		field: 'phone_code_expired'
	},
	active: {
		type: Sequelize.BOOLEAN,
		field: 'active'
	},
	blocked: {
		type: Sequelize.BOOLEAN,
		field: 'blocked'
	},
	blockTime: {
		type: Sequelize.DATE,
		field: 'block_time'
	},
	blockCount: {
		type: Sequelize.INTEGER,
		field: 'block_count'
	},
};

const UserActivationModel = dbConnection.define('userActivationModel', userActivationAttributes, {
	tableName: 'user_activation'
});

module.exports = {

	getNotActivated: function() {
		return UserActivationModel
			.findAll({
				where: {
					activationDate: {
						$eq: null
					}
				}
			});
	},

	findByUserId: function(userId){
		return UserActivationModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	findByAuthToken: function(token) {
		return UserActivationModel
			.findOne({
				where: {'activate_token': token}
			});
	},

	findByForgotToken: function(token) {
		return UserActivationModel
			.findOne({
				where: {'forgot_password_token': token}
			});
	},

	createNew: function(data) {
		return UserActivationModel
			.create(data);
	},

	setActive: function(userId) {
		var now = new Date();
		return UserActivationModel
			.update({
				activationDate: now,
				active: true
			},{
				where: { 'user_id': userId }
			});
	},

	setForgotExpired: function(userId) {
		var now = new Date();

		return UserActivationModel
			.update({
				forgotExpired: now
			},{
				where: { 'user_id': userId }
			});
	},

	setForgot: function(data) {
		var now = new Date();
		var offset = now.getTimezoneOffset();
		var halfHour = new Date(30*60*1000).getTime();
		var expired = new Date(now.getTime() + halfHour - offset*60*1000);

		return UserActivationModel
			.update({
				forgotToken: data.forgotToken,
				forgotExpired: expired
			},{
				where: { 'user_id': data.userId }
			});
	},

	setPhoneCode: function(data) {
		var now = new Date();
		var offset = now.getTimezoneOffset();
		var fiveMinutes = new Date(5*60*1000).getTime();
		var expired = new Date(now.getTime() + fiveMinutes - offset*60*1000);

		return UserActivationModel
			.update({
				phoneCode: data.code,
				codeExpired: expired
			},{
				where: { 'user_id': data.userId }
			});
	},

	getSecret: function(userId) {
		return UserActivationModel
			.findOne({
				where: { 'user_id': userId }
			})
			.then(res => {
				return {
					key: res.secretKey,
					isActive: res.secretActive,
					secretAttempts: res.secretAttempts
				};
			});
	},

	setSecret: function(userId, secret) {
		return UserActivationModel
			.update({
				secretKey: secret,
				secretActive: true
			},{
				where: { 'user_id': userId }
			});
	},

	deleteSecret: function(userId) {
		return UserActivationModel
			.update({
				secretKey: null,
				secretActive: false
			},{
				where: { 'user_id': userId }
			});
	},

	setUserBlock: function(userId) {
		var now = new Date();
		return UserActivationModel
			.update({
				blocked: true,
				blockTime: now,
				blockCount: Sequelize.literal('block_count + 1')
			},{
				where: { 'user_id': userId }
			});
	},

	unlock: function(userId) {
		return UserActivationModel
			.update({
				blocked: false,
				blockTime: null
			},{
				where: { 'user_id': userId }
			});
	},

	updateAttempts: function(data) {
		return UserActivationModel
			.update({
				secretAttempts: data.num
			},{
				where: { 'user_id': data.userId }
			});
	}

};
