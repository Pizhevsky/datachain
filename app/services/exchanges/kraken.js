'use strict';

const fs = require('fs');
const path = require('path');
const request = require("request");
const querystring = require('query-string');
const crypto = require('crypto');
const utils = require('../../utils');

const config = require(path.join(__dirname, '..', '..', 'config', 'config.json'));
const apiKey = config.exchanges.kraken.apiKey;
const apiSecret = config.exchanges.kraken.apiSecret;

const KrakenClient = (function () {
	function KrakenClient(key, secret, timeoutMS) {
		if (key === void 0) { key = ''; }
		if (secret === void 0) { secret = ''; }
		if (timeoutMS === void 0) { timeoutMS = 10000; }
		this.config = {
			url: 'https://api.kraken.com',
			version: '0',
			key: key,
			secret: secret,
			timeoutMS: timeoutMS
		};
	}
	KrakenClient.prototype.api = function (method, params, callback) {
		var methods = {
			public: ['Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread', 'OHLC'],
			private: ['Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder', 'DepositMethods', 'DepositAddresses', 'DepositStatus', 'WithdrawInfo', 'Withdraw', 'WithdrawStatus', 'WithdrawCancel' ]
		};
		if (methods.public.indexOf(method) !== -1) {
			return this.publicMethod(method, params, callback);
		}
		else if (methods.private.indexOf(method) !== -1) {
			return this.privateMethod(method, params, callback);
		}
		else {
			throw new Error(method + ' is not a valid API method.');
		}
	};
	KrakenClient.prototype.publicMethod = function (method, params, callback) {
		params = params || {};
		var path = '/' + this.config.version + '/public/' + method;
		var url = this.config.url + path;
		return this.rawRequest(url, {}, params, callback);
	};
	KrakenClient.prototype.privateMethod = function (method, params, callback) {
		params = params || {};
		var path = '/' + this.config.version + '/private/' + method;
		var url = this.config.url + path;
		params.nonce = +new Date() * 1000;
		var signature = this.getMessageSignature(path, params, params.nonce);
		var headers = {
			'API-Key': this.config.key,
			'API-Sign': signature
		};
		return this.rawRequest(url, headers, params, callback);
	};
	KrakenClient.prototype.getMessageSignature = function (path, request, nonce) {
		var message = querystring.stringify(request);
		var secret = new Buffer(this.config.secret, 'base64');
		var hash = crypto.createHash('sha256');
		var hmac = crypto.createHmac('sha512', secret);
		var hash_digest = hash.update(nonce + message).digest('latin1');
		var hmac_digest = hmac.update(path + hash_digest, 'latin1').digest('base64');
		return hmac_digest;
	};
	KrakenClient.prototype.rawRequest = function (url, headers, params, callback) {
		headers['User-Agent'] = 'Kraken Javascript API Client';
		var options = {
			url: url,
			method: 'POST',
			headers: headers,
			form: params,
			timeout: this.config.timeoutMS
		};
		var req = request.post(options, function (error, response, body) {
			if (typeof callback === 'function') {
				var data;
				if (error) {
					callback(new Error('Error in server response: ' + JSON.stringify(error)), null);
					return;
				}
				try {
					data = JSON.parse(body);
				}
				catch (e) {
					callback(new Error('Could not understand response from server: ' + body), null);
					return;
				}
				if (data.error && data.error.length) {
					callback(data.error, null);
				}
				else {
					callback(null, data);
				}
			}
		});
		return req;
	};
	return KrakenClient;
}());

const kraken = new KrakenClient(apiKey, apiSecret);

const cleanCurrency = function(name) {
	let first_letter = name.slice(0,1);
	return first_letter == 'X' || first_letter == 'Z'
		? name.slice(1)
		: name;
}

module.exports = {

	getExchangeInfo: function (data, cbSuccess, cbError) {
		kraken.api('AssetPairs', null, function(error, data) {
			if(error) {
				console.log('AssetPairs error: ', error);
				cbError({ success: false, message: error });
			} else {
				let result = data.result,
					markets = [],
					fees = {
						common: {},
						byCurrency: []
					};

				let keys = Object.keys(result).filter(key => key.slice(-2) != '.d');

				if (keys.length) {
					keys.forEach(key => {
						let item = result[key],
							currency1 = cleanCurrency(item.base),
							currency2 = cleanCurrency(item.quote);
						// item.fee_volume_currency
						markets.push({
							id: key,
							name: `${currency1}-${currency2}`,
							currency1,
							currency2
						});

						fees.common = {
							maker: 0.16, // item.fees_maker[0][1],
							taker: 0.26
						}
					});

					cbSuccess({ success: true, data: { markets, fees }});
				} else {
					cbError({ success: false, message: 'Init error!' });
				}
			}
		});
	},

	newOrder: function(data, cbSuccess, cbError) {
		let options = {
			"pair": data.market,
			"volume": data.amount,
			"price": data.price,
			"type": data.side,
			"ordertype": data.type
		};

		kraken.api('Ticker', options, function(error, data) {
			if (error) {
				cbError({ success: false, message: error });
				return;
			}
			let response = data.result;
			cbSuccess({ success: true, data: { orderId: response.txid }});
		});
	},

	cancelOrder: function(data, cbSuccess, cbError) {
		kraken.api('CancelOrder', {"txid": data.orderId}, function(error, data) {
			if (error) {
				cbError({ success: false, message: error });
				return;
			}
			let response = data.result;
			cbSuccess({ success: true, data: { order: response }});
		});
	},

	getDepositAddress: function(data, cbSuccess, cbError) {
		let currency = data.currency;
		kraken.api('DepositMethods', { "asset": currency }, function(error, data) {
			if (error) {
				cbError({ success: false, message: error });
				return;
			}
			kraken.api('DepositAddresses', { "asset": currency, "method": data.result[0].method }, function(error, data) {
				if (error) {
					cbError({ success: false, message: error });
					return;
				}
				let response = data.result[0];
				cbSuccess({ success: true, data: { address: response.address }});
			});
		});
	},

	getWithdrawInfo: function(data, cbSuccess, cbError) {
		let options = {
			"asset": data.currency,
			"key": 'bitcoinKeyName',
			"amount": 0.002
		};
		kraken.api('WithdrawInfo', options, function(error, data) {
			if (error) {
				cbError({ success: false, message: error });
				return;
			}
			let response = data.result[0];
			cbSuccess({ success: true, data: { fee: response.fee }});
		});
	},

	withdraw: function(data, cbSuccess, cbError) {
		let options = {
			"asset": data.currency,
			"key": 'bitcoinKeyName',
			"amount": data.amount
		};
		kraken.api('Withdraw', options, function(error, data) {
			if (error) {
				cbError({ success: false, message: error });
				return;
			}
			let response = data.result;
			cbSuccess({ success: true, data: response });
		});
	},

	getTickData: function(data, cbSuccess, cbError) {
		let market = data.market;
		kraken.api('Ticker', {"pair": market}, function(error, data) {
			if(error) {
				cbError({ success: false, message: error });
				return;
			}
			let tickData = data.result[market];
			let ticker = {
				ask: utils.roundDecimal(tickData.a[0], 1),
				bid: utils.roundDecimal(tickData.b[0], 1),
				last: utils.roundDecimal(tickData.c[0], 1),
				low: utils.roundDecimal(tickData.l[1], 1),
				high: utils.roundDecimal(tickData.h[1], 1),
				volume: utils.roundDecimal(tickData.v[1], 1)
			};

			kraken.api('Trades', {"pair": market}, function(error, data) {
				if(error) {
					cbError({ success: false, message: error });
					return;
				}
				let tradeData = data.result[market];
				let tradeHistory = tradeData.slice(-50).reverse().map(item => {
					return {
						id: item.tid,
						price: parseFloat(item[0]),
						amount: parseFloat(item[1]),
						type: item[3] == 's' ? 'sell' : 'buy',
						timestamp: item[2],
						time: utils.getTime(item[2] * 1000)
					};
				});

				kraken.api('Depth', {"pair": market}, function(error, data) {
					if(error) {
						cbError({ success: false, message: error });
						return;
					}
					let bookData = data.result[market];
					let orderBook = {
						bids: bookData.bids.map(item => {
							return {
								price: parseFloat(item[0]),
								amount: parseFloat(item[1]),
								timestamp: item[2],
								time: utils.getTime(item[2] * 1000)
							}
						}),
						asks: bookData.asks.map(item => {
							return {
								price: parseFloat(item[0]),
								amount: parseFloat(item[1]),
								timestamp: item[2],
								time: utils.getTime(item[2] * 1000)
							}
						})
					};

					cbSuccess({ success: true, data: { ticker, tradeHistory, orderBook }});
				});
			});
		});
	},

	getUserData: function(data, cbSuccess, cbError) {
		let market = data.market;
		kraken.api('Balance', null, function(error, data) {
			if(error) {
				cbError({ success: false, message: error });
				return;
			}
			let keys = Object.keys(data.result);
			let balances = keys.map(key => {
				let value = data.result[key];
				return {
					name: cleanCurrency(key.toUpperCase()),
					amount: value,
					available: value
				}
			});

			let orders = {};
			
			kraken.api('OpenOrders', null, function(error, data) {
				if(error) {
					cbError({ success: false, message: error });
					return;
				}
				let keys = Object.keys(data.result.open);
				orders.open = keys.map(key => {
					let item = data.result.open[key];
					return {
						id: item.refid,
						pair: item.descr.pair,
						price: item.price,
						remaining: item.descr.leverage, // or .cost
						side: item.descr.type,
						type: item.descr.ordertype,
						timestamp: item.opentm,
						time: utils.getTime(item.opentm * 1000),
						cancelled: item.status,
					}
				});

				kraken.api('TradesHistory', null, function(error, data) {
					if(error) {
						cbError({ success: false, message: error });
						return;
					}
					let keys = Object.keys(data.result.trades);
					orders.history = keys.map(key => {
						let item = data.result.trades[key];
						return{
							id: item.order_id,
							price: parseFloat(item.price),
							amount: parseFloat(item.cost),
							side: item.type,
							type: item.ordertype,
							fee: {
								amount: parseFloat(item.fee)
							},
							timestamp: item.time,
							time: utils.getTime(item.time * 1000)
						}
					});

					cbSuccess({ success: true, data: { balances, orders }});
				});
			});
		});
	}
};