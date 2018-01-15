'use strict';

const fs = require("fs");
const rp = require('request-promise');
const UserArbitrageModel = require('../models/userArbitrageModel');
const UserBalanceModel = require('../models/userBalanceModel');
const UserModel = require('../models/userModel');
const logger = require('../services/loggerService');

const config = require(path.join(__dirname, '..', 'config', 'config.json'));
const apiKey = config.cryptoWallet.key;
const baseUrl = config.cryptoWallet.url;
const currencyAdress = config.old_arbitrage;

const _get = function(path, email) {
	const url = baseUrl + path;

	let options = {
		method: 'GET',
		url: url,
		headers: {
			'content-type': 'application/json',
			'x-authorization': apiKey,
			'x-email': email
		}
	};

	console.log('Send to wallet:', options);

	return rp(options);
};

const _post = function(path, body, email) {
	const url = baseUrl + path;

	let headers = {
		'content-type': 'application/json',
		'x-authorization': apiKey
	};

	if (email) {
		headers['x-email'] = email;
	}

	let options = {
		method: 'POST',
		url,
		headers,
		body
	};

	console.log('Send to wallet:', options);

	return rp(options);
};

module.exports = {
	generateAccount: function (data) {
		return _post('users/',  JSON.stringify(data));
	},

	getUserInfo: function (user) {
		return _get('users/info', user.email);
	},

	getUserBalances: function (user) {
		return _get('users/balances', user.email);
	},

	getTransactions: function (user, currency) {
		return _get(`transactions/${currency}`, user.email);
	},

	onWalletUpdate: function (req, res) {
		logger.trace('onWalletUpdate');
		logger.trace('onWalletUpdate headers:', req.headers);
		logger.trace('onWalletUpdate params:', req.params);
		logger.trace('onWalletUpdate body:', req.body);
		logger.trace('onWalletUpdate apiKey:', apiKey);
		
		let key = req.headers['x-authorization'];
		if (key != apiKey) {
			res.send({"data": {},"error": {"status": 1,"message": "Invalid authorization token"}});
			return;
		}

		let email = req.headers['x-email'];
		let currency = req.params.currency;
		let prev_balance = req.body ? req.body.prev_balance : -1;
		let new_balance = req.body ? req.body.new_balance : -1;
		let balance = {};
		balance[currency] = new_balance;
		logger.trace('onWalletUpdate email:', email);
		logger.trace('onWalletUpdate balance:', balance);

		UserModel.findByUserEmail(email)
			.then(user => {
				logger.trace('onWalletUpdate user.id:', user.id);
				UserBalanceModel.update(user.id, balance)
					.then(result => {
						logger.trace('onWalletUpdate balance updated:', currency, ':', prev_balance, '->', new_balance);
						console.log('balance updated: ', currency, ':', prev_balance, '->', new_balance);
						res.send({"error": {"status": 0}});
					})
					.catch(e => {
						logger.error('onWalletUpdate balance not updated:', currency, ':', prev_balance, '->', new_balance);
						res.send({"error": e});
					});
			})
			.catch(e => {
				logger.error('onWalletUpdate user not found:', email);
				res.send({"error": e});
			});
	},

	sendCurrency: function (req, res) {
		let currency = req.body.currency && req.body.currency.toLowerCase();
		if (!req.body.currency) {
			res.send({ success: false, message: 'Currency not found!' });
			return;
		}

		let address = currencyAdress[currency];
		if (!address) {
			res.send({ success: false, message: 'Currency not supported!' });
			return;
		}

		let obj = {};
		obj[currency] = req.body.total;

		UserArbitrageModel.update(req.user.id, obj)
			.then(result => {
				let data = {
					amount: req.body.amount,
					address
				};

				_post('/wallets/' + currency,  JSON.stringify(data), req.body.email)
					.then(data => {
						res.send({ success: true, data });
					});
			})

	}
};