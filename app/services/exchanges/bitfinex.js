'use strict';

const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const crypto = require('crypto');
const utils = require('../../utils');

const config = require(path.join(__dirname, '..', '..', 'config', 'config.json'));
const apiKey = config.exchanges.bitfinex.apiKey;
const apiSecret = config.exchanges.bitfinex.apiSecret;
const baseUrl = 'https://api.bitfinex.com/v1';

const _get = function(path) {
	const url = baseUrl + path;

	return rp(url);
};

const _post = function(path, options) {
	const url = baseUrl + path;
	const nonce = (Date.now() * 1000).toString();
	const body = {
		request: '/v1' + path,
		nonce
	};

	if (options) {
		Object.keys(options).forEach(key => {
			body[key] = options[key];
		});
	}

	const payload = new Buffer(JSON.stringify(body)).toString('base64');

	const signature = crypto
		.createHmac('sha384', apiSecret)
		.update(payload)
		.digest('hex');

	return rp({
		method: 'POST',
		url: url,
		headers: {
			'X-BFX-APIKEY': apiKey,
			'X-BFX-PAYLOAD': payload,
			'X-BFX-SIGNATURE': signature
		},
		body: body,
		json: true
	});
};

const marketNameConvert = {
	'BTC-USD': 'btcusd',
	'BTC-ETH': 'ethbtc'
};

module.exports = {
	
	ticker: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/pubticker/${market}`).then(JSON.parse);
	},

	orderBook: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/book/${market}?limit_bids=${params.depth}&limit_asks=${params.depth}`).then(JSON.parse);
	},

	trades: function (params) {
		let market = marketNameConvert[params.market] || params.market;
		return _get(`/trades/${market}?limit_trades=200`).then(JSON.parse);
	},

	getMarkets: function (params) {
		return _get('/symbols_details').then(response => {
			let data = JSON.parse(response);
			return data.map(item => item.pair);
		});
	},
	
	getExchangeInfo: function (params) {
		return Promise.all([
				_post('/account_infos'),
				_get('/symbols_details')
			])
			.then(([info, details]) => {
				let fData = info[0],
					mData = JSON.parse(details);

				return {
					markets: mData.map(item => {
						let currency1 = item.pair.slice(0,3).toUpperCase();
						let currency2 = item.pair.slice(3).toUpperCase();
						return {
							id: item.pair,
							name: `${currency1}-${currency2}`,
							min: item.minimum_order_size,
							max: item.maximum_order_size,
							currency1,
							currency2
						}
					}),
					fees: {
						common: {
							maker: fData.maker_fees,
							taker: fData.taker_fees
						},
						byCurrency: fData.fees.map(item => {
							return {
								name: item.pairs,
								maker: item.maker_fees,
								taker: item.taker_fees
							}
						})
					}
				};
			});
	},

	newOrder: function(params) {
		let options = {
			symbol: params.market,
			amount: params.amount,
			price: params.price,
			exchange: 'bitfinex',
			side: params.side,
			type: `exchange ${params.type}`
		}

		return _post('/order/new', options)
			.then(response => {
				return { orderId: response.order_id };
			});
	},
	
	cancelOrder: function(params) {
		return _post('/order/cancel', { order_id: params.orderId });
	},

	getDepositAddress: function(params) {
		let options = {
			wallet_name: 'exchange',
			method: 'bitcoin'
		};
		return _post('/deposit/new', options)
			.then(response => {
				return { address: response.address };
			});
	},

	getWithdrawInfo: function(params) {
		return _post('/account_fees')
			.then(response => {
				return { fee: parseFloat(response.withdraw[data.currency]) };
			});
	},

	withdraw: function(params) {
		let options = {
			withdraw_type: 'bitcoin',
			walletselected: 'exchange',
			amount: params.amount,
			address: params.address
		}
		return _post('/withdraw', options);
	},

	getUserData: function(params) {
		let options = {
			symbol: params.market,
			timestamp: new Date('2000-01-01').getTime()
		};

		return Promise.all([
				_post('/balances'),
				_post('/orders'),
				_post('/mytrades', options)
			])
			.then(([balancesData, ordersData, tradesData]) => {
				let balances = balancesData.filter(item => item.type == 'exchange')
					.map(item => {
						return {
							name: item.currency.toUpperCase(),
							amount: item.amount,
							available: item.available
						}
					});

				let orders = {
					open: ordersData.map(item => {
						return{
							id: item.id,
							pair: item.symbol,
							price: item.price,
							amount: item.remaining_amount,
							side: item.side,
							type: item.type,
							timestamp: item.timestamp,
							time: utils.getTime(item.timestamp * 1000),
							cancelled: item.is_cancelled,
						}
					}),
					history: tradesData.map(item => {
						let side = item.type.split(' ').slice(-1)[0];
						return {
							id: item.order_id,
							pair: params.market,
							price: parseFloat(item.price),
							amount: parseFloat(item.amount),
							side: side,
							type: item.type,
							fee: {
								currency: item.fee_currency,
								amount: parseFloat(item.fee_amount)
							},
							timestamp: item.timestamp,
							time: utils.getTime(item.timestamp * 1000)
						};
					})
				};

				return { balances, orders };
			});
	},

	getArbitrageInfo: function(data, cbSuccess, cbError) {
		let currencyMap = {
			'BTC': 'BTC',
			'XBT': 'BTC',
			'USD': 'USD',
			'USDT': 'USD'
		};
		let market = 'btcusd';
		
		let options = {
			symbol: 'btcusd',
			timestamp: new Date('2000-01-01').getTime() / 1000
		};

		return Promise.all([
				_post('/account_infos'),
				_post('/balances'),
				_post('/mytrades', options)
			])
			.then(([info, balancesData, tradesData]) => {
				let fees = {
					maker: info[0].maker_fees,
					taker: info[0].taker_fees
				};


				let data = balancesData.filter(item => item.type == 'exchange' && !!currencyMap[item.currency.toUpperCase()]);
				let balances = {};
				data.forEach(item => {
					let currency = currencyMap[item.currency.toUpperCase()];

					balances[currency] = {
						amount: item.amount,
						available: item.available
					};
				});
				let orders = tradesData.map(item => {
					let side = item.type.split(' ').slice(-1)[0];
					return {
						id: item.order_id,
						exchange: 'Bitfinex',
						price: parseFloat(item.price),
						amount: parseFloat(item.amount),
						side: side,
						type: item.type,
						fee: {
							currency: item.fee_currency,
							amount: parseFloat(item.fee_amount)
						},
						timestamp: item.timestamp * 1000,
						time: utils.getTime(item.timestamp * 1000)
					}
				});

				return { name: 'Bitfinex', market, fees, balances, orders };
			});
	}


};

