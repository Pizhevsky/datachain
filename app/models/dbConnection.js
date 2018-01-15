"use strict";

var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "production";
const config = require(path.join(__dirname, '..', 'config', 'config.json'));
const dbData = config.db[env];

console.log('config:', config);
console.log('env:', env);

const originalSequelizeQueryFunction = Sequelize.prototype.query;

Sequelize.prototype.query = function () {
	return originalSequelizeQueryFunction
		.apply(this, arguments)
		.catch(error => {
			console.log('DataBase error:', error);
		});
};

const db = new Sequelize(dbData.database, dbData.username, dbData.password, {
	host: dbData.host,
	port: dbData.port,
	dialect: 'mysql',
	logging: false,
	define: {
		timestamps: false
	}
});

db.sync().then(function(){
	console.log('Database initialized.');
}).catch(function(err){
	console.log('Database initialize error!');
	console.log('Error:', err);
});

module.exports = db;
