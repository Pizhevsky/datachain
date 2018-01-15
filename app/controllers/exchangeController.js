"use strict";

var Bitfinex = require('../services/exchanges/bitfinex');
var Bittrex = require('../services/exchanges/bittrex');
var Kraken = require('../services/exchanges/kraken');
var Wex = require('../services/exchanges/wex');
var Poloniex = require('../services/exchanges/poloniex');
var Ticker = require('../services/exchangeTicker');
var rp = require('request-promise');

var exchanges = {
	Bitfinex,
	Bittrex,
	//Kraken,
	Wex,
	Poloniex
}

function route (method, req,res) {
	let exchange = exchanges[req.body.exchange];
	
	if (!exchange) {
		res.json({ success: false, message: `Exchange "${req.body.exchange}" not plugged!` });
		return;
	}
	if (!exchange[method]) {
		res.json({ success: false, message: `Method "${method}" not found!` });
		return;
	}

	exchange[method](req.body)
		.then(response => {
			res.json({ success: true, data: response });
		})
		.catch(e => {
			console.log(`${req.body.exchange} ${method} aborted:`, e);
			res.json({ success: false, message: e });
		});
}

module.exports = {
	getExchangesList: function (req, res) {
		res.send({ success: true, data: Object.keys(exchanges)});
	},
	
	/*
	{
		markets: [{
			name: 'btcusd',
			min: 0.004,
			max: 2000
		}],
		fees: {
			common: {
				maker: 0.1,
				taker: 0.2
			},
			byCurrency: [{
				name: 'btc'
				maker: 0.1,
				taker: 0.2
			}]
		}
	}
	*/
	getExchangeInfo: function(req, res) {
		route('getExchangeInfo', req, res);
	},

	/*
	{
		order: order_id
	}
	*/
	newOrder: function(req,res) {
		route('newOrder', req, res);
	},
	
	/*
	{
		??
	}
	*/
	cancelOrder: function(req,res) {
		route('cancelOrder', req, res);
	},
	

	/*
	{
		balances: [{
			name: 'btc',
			amount: 7.23,
			available: 0.04
		}],
		orders: {
			open: [{
				id:448411365,
				pair: 'btcusd',
				price: 0.02,
				amount: 0.02,
				side: 'buy',
				type: 'exchange limit',
				timestamp: 1444276597,
				time: '21:13:27',
				cancelled: false
			}],
			history: [{
				id: 446913929
				pair: 'btcusd',
				price: 246.94,
				amount: 1.0,
				type: 'Buy',
				fee: {
					currency: 'USD',
					amount:-0.49388
				},
				timestamp: 1444141857,
				time: '21:13:27'
			}]
		}
	}
	*/
	getUserData: function(req,res) {
		route('getUserData', req, res);
	},

	/*
	{
		adress: '19HRp5CwNKJVYneWww3TYhrsLg3qtgz8v2'
	}
	 */
	getDepositAddress: function(req, res) {
		route('getDepositAddress', req, res);
	},

	getWithdrawInfo: function(req, res) {
		//route('getWithdrawInfo', req, res);
	},

	withdraw: function(req, res) {
		route('withdraw', req, res);
	},

	getArbitrageInfo: function(req, res) {
		route('getArbitrageInfo', req, res);
	},

	/*
	ticker: {
		bid: 244.75,
		ask: 244.76,
		last: 244.82,
		low: 244.2,
		high: 248.19,
		volume: 7842.11542563
	};
	trades: [{
		id: 11988919,
		price: 244.8,
		amount: 0.03297384,
		type: 'sell',
		timestamp: 1444266681,
		time: '21:13:27'
	}];
	orderBook: {
		bids: [{
			price: 574.61,
			amount: 0.1439327
		}],
		asks: [{
			price: 574.62,
			amount: 19.1334
		}]
	};
	*/
	getTickData: function(req, res) {
		res.json(Ticker.getTickData(req.body));
	},

	cors: function(req, res) {
		rp({
			method: 'GET',
			url: decodeURIComponent(req.body.url)
		}).then(response => {
			res.json({ success: true, response });
		}).catch(e => {
			//console.log('cors aborted:', e);
			res.json({ success: false, message: 'CORS error' });
		});
	}
};
