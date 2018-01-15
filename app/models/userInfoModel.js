"use strict";

const Sequelize = require('sequelize');
const dbConnection = require('./dbConnection');

const userInfoAttributes = {
	userId: {
		type: Sequelize.INTEGER,
		field: 'user_id',
		primaryKey: true
	},
	firstname: {
		type: Sequelize.STRING,
		field: 'firstname',
		notEmpty: true
	},
	lastname: {
		type: Sequelize.STRING,
		field: 'lastname'
	},
	phone: {
		type: Sequelize.STRING,
		field: 'phone'
	},
	citizen: {
		type: Sequelize.STRING,
		field: 'citizen'
	},
	birthday: {
		type: Sequelize.DATE,
		field: 'birthday'
	},
	passport: {
		type: Sequelize.STRING,
		field: 'passport'
	},
	registration: {
		type: Sequelize.STRING,
		field: 'registration'
	},
	photoDoc: {
		type: Sequelize.STRING,
		field: 'photo_doc'
	},
	verified: {
		type: Sequelize.BOOLEAN,
		field: 'verified'
	}
};

const UserInfoModel = dbConnection.define('userInfoModel', userInfoAttributes, {
	tableName: 'user_info'
});

module.exports = {
	
	findByUserId: function(userId){
		return UserInfoModel
			.findOne({
				where: {'user_id': userId}
			});
	},

	createNew: function(userId){
		return UserInfoModel
			.create({
				userId: userId
			});
	},

	updatePhone: function (userId, phone) {
		return UserInfoModel
			.update({
				phone: phone
			},{
				where: { 'user_id': userId }
			});
	},

	updateData: function(userId, data) {
		return UserInfoModel
			.update(data, {
				where: { 'user_id': userId }
			});
	}
	
};
