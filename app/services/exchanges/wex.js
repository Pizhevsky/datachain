'use strict';

const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const crypto = require('crypto');
var querystring = require('query-string');
const utils = require('../../utils');

const config = require(path.join(__dirname, '..', '..', 'config', 'config.json'));
const apiKey = config.exchanges.wex.apiKey;
const apiSecret = config.exchanges.wex.apiSecret;
const baseUrl = 'https://wex.nz';

const _get = function(path) {
	const url = baseUrl + '/api/3' + path;

	return rp(url + '?ignore_invalid=1');
};

let nonceCount = 1;

const _post = function(method, options) {
	const url = baseUrl + '/tapi';
	const nonce = nonceCount++;
	const body = {
		method: method,
		nonce
	};

	if (options) {
		Object.keys(options).forEach(key => {
			body[key] = options[key];
		});
	}

	const postData = querystring.stringify(body);
	const signature = crypto.createHmac("sha512", apiSecret).update(new Buffer(postData)).digest("hex").toString();

	return rp({
		method: 'POST',
		url: url,
		headers: {
			"Key": apiKey,
			"Sign": signature,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: postData
	});
};

_post('getInfo').then(response => {
	var data = JSON.parse(response);
	if (!data.success) {
		nonceCount = Number(data.error.match(/:\d*/g).slice(-1)[0].slice(1));
	}
	console.log('Wex nonceCount:', nonceCount);
	if (nonceCount >= 4294967294) {
		console.log(`Attention!! Wex needs new API key!`);
	}
});

const marketNameConvert = {
	'BTC-USD': 'btc_usd',
	'BTC-ETH': 'eth_btc'
};

module.exports = {
	
	ticker: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/ticker/${market}`).then(JSON.parse);
	},

	orderBook: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/depth/${market}?limit=${params.depth}`).then(JSON.parse);
	},

	trades: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/trades/${market}?limit=200`).then(JSON.parse);
	},

	getMarkets: function (params) {
		return _get('/info').then(response => {
			let data = JSON.parse(response);
			return Object.keys(data.pairs);
		});
	},

	getExchangeInfo: function (params) {
		return _get('/info')
			.then(response => {
				let data = JSON.parse(response),
					keys = Object.keys(data.pairs),
					markets = [],
					fees = {
						common: {
							maker: 0.2,
							taker: 0.2
						},
						byCurrency: []
					};

				if (!keys.length) {
					throw new Error('Markets not found!');
				}

				keys.forEach(key => {

					let item = data.pairs[key],
						tmpArr = key.split('_'),
						currency1 = tmpArr[0].toUpperCase(),
						currency2 = tmpArr[1].toUpperCase();

					markets.push({
						id: key,
						name: `${currency1}-${currency2}`,
						min: item.min_amount,
						currency1,
						currency2
					});

					fees.byCurrency.push({
						name: key,
						maker: item.fee,
						taker: item.fee
					});
				});

				return { markets, fees };
			});
	},

	newOrder: function(params) {
		let options = {
			pair: params.market,
			amount: params.amount,
			rate: params.price,
			type: params.side
		}

		return _post('Trade', options)
			.then(response => {
				let data = JSON.parse(response);

				if (data.success) {
					return { orderId: data.return.order_id };
				} else {
					throw new Error(data.error);
				}
			});
	},
	
	cancelOrder: function(params) {
		return _post('CancelOrder', { order_id: params.orderId })
			.then(response => {
				let data = JSON.parse(response);

				return data.return;
			});
	},

	getDepositAddress: function(params) {
		return _post('CoinDepositAddress', { coinName: data.currency })
			.then(response => {
				let data = JSON.parse(response);

				return { address: data.return.address };
			});
	},

	getWithdrawInfo: function(params) {
		return { fee: '0.001' };
	},

	withdraw: function(params) {
		let options = {
			coinName: data.currency,
			amount: data.amount,
			address: data.address
		};

		return _post('WithdrawCoin', options)
			.then(response => {
				let data = JSON.parse(response);
				return data;
			});
	},

	getUserData: function(params) {
		return Promise.all([
				_post('getInfo'),
				_post('ActiveOrders'),
				_post('TradeHistory')
			])
			.then(([info, activeOrders, trades]) => {
				let infoData = JSON.parse(info),
					ordersData = JSON.parse(activeOrders),
					tradesData = JSON.parse(trades),
					balances = [],
					orders = {};

				if (infoData.success) {
					let keys = Object.keys(infoData.return.funds);
					balances = keys.map(key => {
						let value = infoData.return.funds[key];
						return {
							name: key.toUpperCase(),
							amount: value,
							available: value
						}
					});
				}

				if (ordersData.success) {
					let keys = Object.keys(ordersData.return);
					orders.open = keys.map(key => {
						let item = ordersData.return[key];
						return{
							id: key,
							pair: item.pair,
							price: item.rate,
							amount: item.amount,
							side: item.type,
							type: item.type,
							timestamp: item.timestamp_created,
							time: utils.getTime(item.timestamp_created * 1000)
						}
					});
				}

				if (tradesData.success) {
					let keys = Object.keys(tradesData.return);
					orders.history = keys.map(key => {
						let item = tradesData.return[key];
						return {
							id: item.order_id,
							price: parseFloat(item.price),
							amount: parseFloat(item.amount),
							side: item.type,
							type: item.type,
							timestamp: item.timestamp,
							time: utils.getTime(item.timestamp * 1000)
						}
					});
				}

				return { balances, orders };
			});
	},

	getArbitrageInfo: function(params) {
		let currencyMap = {
			'BTC': 'BTC',
			'XBT': 'BTC',
			'USD': 'USD',
			'USDT': 'USD'
		};

		let fees = {
			maker: 0.2,
			taker: 0.2
		};

		let market = 'btc_usd';

		return Promise.all([
				_post('getInfo'),
				_post('TradeHistory')
			])
			.then(([info, trades]) => {
				let infoData = JSON.parse(info),
					tradesData = JSON.parse(trades),
					orders = [],
					balances = {};

				if (infoData.success) {
					let keys = Object.keys(infoData.return.funds);
					keys.filter(key => !!currencyMap[key.toUpperCase()]).map(key => {
						let value = infoData.return.funds[key];
						let currency = currencyMap[key.toUpperCase()];

						balances[currency] = {
							amount: value,
							available: value
						};
					});
				}


				if (tradesData.success) {
					let keys = Object.keys(tradesData.return);
					orders = keys.map(key => {
						let item = tradesData.return[key];
						return {
							id: item.order_id,
							exchange: 'Wex',
							price: parseFloat(item.price) || parseFloat(item.amount)*0.0025,
							amount: parseFloat(item.amount),
							side: item.type,
							type: item.type,
							fee: {
								amount: 0.25
							},
							timestamp: item.timestamp * 1000,
							time: utils.getTime(item.timestamp * 1000)
						}
					});
				}

				return { name: 'Wex', market, fees, balances, orders };
			});
	}
};

