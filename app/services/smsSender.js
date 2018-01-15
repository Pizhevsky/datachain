'use strict';

var fs = require("fs");
var path = require("path");
var rp = require('request-promise');

const config = require(path.join(__dirname, '..', 'config', 'config.json'));
var apiKey = config.sms.apiKey;

var send = function (phoneNumber, text) {
	console.log(`SMS to ${phoneNumber} with text:'${text}' sended`);

	rp(`http://smspilot.ru/api.php?send=${encodeURIComponent(text)}&to=${phoneNumber}&from=INFORM&apikey=${apiKey}`)
		.then(function (response) {
			console.log(`SMS successfuly sended:`, response);
		})
		.catch(function (err) {
			console.log(`SMS send aborted:`, err);
		});
}

module.exports = { send };