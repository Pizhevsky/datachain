"use strict";

var fs = require("fs");
var path = require("path");
var nodemailer = require('nodemailer');
var logger = require('../services/loggerService');

const config = require(path.join(__dirname, '..', 'config', 'config.json'));
const gmailConfig = config.email.gmail;
const amazonConfig = config.email.amazon;
const fcometConfig = config.email.fcomet;
const host = process.env.NODE_ENV == 'production' ? 'https://arbidex-promo.com/' : 'https://localhost:5000/'; // req.headers.origin

// let options = {
// 	service: 'gmail',
// 	auth: gmailConfig
// };

// let options = {
// 	host: 'email-smtp.eu-west-1.amazonaws.com',
// 	port: 465,
// 	secure: true, // true for 465, false for other ports
// 	auth: amazonConfig
// };

let options = {
	host: 'de9.fcomet.com',
	port: 25,
	logger: true,
	ignoreTLS: true,
	secure: false, // true for 465, false for other ports
	auth: fcometConfig
};

console.log('Email options:', options);

let transporter = nodemailer.createTransport(options);

transporter.verify(function(error, success) {
	if (error) {
		console.log('Email server error:', error);
	} else {
		console.log('Email server is ready to take our messages');
	}
});

var send = function (email, body) {
	var mailOptions = {
		from: fcometConfig.user, // 'denis.pizhevsky@gmail.com', //'info@datachain.awsapps.com',
		to: email,
		subject: body.subj,
		html: body.html
	};

	transporter.sendMail(mailOptions, function (error, response) {
		if (error) {
			logger.error('Message send:', mailOptions);
			logger.error('Message error:', error);
			body.fail();
		} else {
			logger.trace('Message sent:', mailOptions);
			logger.trace('Message response: ', response);
			body.success();
		}
	});
};

module.exports = {
	send,

	sendEmailConfirm: function (params) {
		let host = params.host || 'https://arbidex-promo.com',
			url = host + '/verifyEmail/' + params.token;
		send(params.email, {
			subj: 'Please confirm your Email account',
			html: `Hello,<br> Please Click on the link to verify your email.<br><a href="${url}">Click here to verify</a><br><br>If the link doesn't work you can copy and paste into the address bar this link: ${url}`,
			success: params.success,
			fail: params.fail
		});
	},

	sendEmailReset: function (params) {
		let host = params.host || 'https://arbidex-promo.com',
			url = host + '/verifyReset/' + params.token;
		send(params.email, {
			subj: 'Reset password',
			html: `Hello,<br> Please Click on the link to reset your password.<br><a href="${url}">Click here to reset</a><br><br>If the link doesn't work you can copy and paste into the address bar this link: ${url}`,
			success: params.success,
			fail: params.fail
		});
	},
	
	sendEmailActivate: function (params) {
		let host = params.host || 'https://arbidex-promo.com',
			url = host + '/verifyEmail/' + params.token;
		send(params.email, {
			subj: 'Please return to Arbidex MVP and confirm your Email account',
			html: `Hello,<br> We found that you didn't finish your account activation. Thank you for your patience, please help us to improve our platform. Click on the link to verify your email.<br><a href="${url}">Click here to verify</a><br><br>If the link doesn't work you can copy and paste into the address bar this link: ${url}<br><br>If you still experience difficulties, please, write to support@arbidex-promo.com.`,
			success: params.success,
			fail: params.fail
		});
	},

};