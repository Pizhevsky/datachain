angular.module('dashboardApp').factory('Exchanges', function($http) {
	let config = {
		orderBookDepth: 1000, // max 500 look Kraken
		tradesDepth: 200 // max 200 look Bittrex
	};

	let urlParts = {
		Bitfinex: {
			base: 'https://api.bitfinex.com/v1/',
			ticker: 'pubticker/[market]',
			orderBook: 'book/[market]?limit_bids=[depth]&limit_asks=[depth]', // depth up to 5000  ( asks 1908 ? )
			trades: 'trades/[market]?limit_trades=200', // depth == 50 || ?limit_trades=[depth]
			candels: 'https://api.bitfinex.com/v2/candles/trade:[interval]:t[market]/hist' // https://api.bitfinex.com/v2/candles/trade:1h:tBTCUSD/last
		},
		Bittrex: {
			base: 'https://bittrex.com/api/v1.1/public/',
			ticker: 'getmarketsummary?market=[market]',
			orderBook: 'getorderbook?market=[market]&type=[side]', // depth up to 5000 ( sell 1827 ? )
			trades: 'getmarkethistory?market=[market]', // depth == 200 always                                                               1511544600 poloniex
			candels: 'https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=[market]&tickInterval=[interval]', // GetLatestTick //  &_=1512748246085  startDate?
		},
		Kraken: {
			base: 'https://api.kraken.com/0/public/',
			ticker: 'Ticker',
			orderBook: 'Depth?pair=[market]&count=[depth]', // depth up to 500 !!
			trades: 'Trades?pair=[market]', // depth == 1000 || since = return trade data since given id (optional.  exclusive)
			candels: 'https://api.kraken.com/0/public/OHLC?pair=[market]&interval=[interval]', // minutes
		},
		Wex: {
			base: 'https://wex.nz/api/3/',
			ticker: 'ticker/[market]',
			orderBook: 'depth/[market]?limit=[depth]', // depth up to 5000
			trades: 'trades/[market]?limit=[depth]', // depth == 150 || ?limit=[depth]
			candels: '' // counting by trades limit=5000
		},
		Poloniex: {
			base: 'https://poloniex.com/public?',
			ticker: 'command=returnTicker&[market]',
			orderBook: 'command=returnOrderBook&currencyPair=[market]&depth=[depth]', // depth up to 5000
			trades: 'command=returnTradeHistory&currencyPair=[market]', // depth == 200 ||  up to 50,000 trades between  &start=1410158341&end=1410499372
			candels: 'https://poloniex.com/public?command=returnChartData&currencyPair=[market]&start=[start]&end=9999999999&period=[interval]', // seconds
		}
	}

	let parse = {
		ticker: {
			Bitfinex: (response, market) => {
				return parseTicker(response, ['ask', 'bid', 'last_price', 'low', 'high', 'volume']);
			},
			Bittrex: (response, market) => {
				return  parseTicker(response, ['Ask', 'Bid', 'Last', 'Low', 'High', 'Volume']);
			},
			Kraken: (response, market) => {
				let data = response.result[market];
				let tickData = {
					ask: data.a[0],
					bid: data.b[0],
					last: data.c[0],
					low: data.l[1],
					high: data.h[1],
					volume: data.v[1],
				};

				return parseTicker(tickData, ['ask', 'bid', 'last', 'low', 'high', 'volume']);
			},
			Wex: (response, market) => {
				return parseTicker(response[market], ['sell', 'buy', 'last', 'low', 'high', 'vol']);
			},
			Poloniex: (response, market) => {
				return parseTicker(response, ['lowestAsk', 'highestBid', 'last', 'low24hr', 'high24hr', 'baseVolume']); // or return24hVolume ?
			}
		},
		orderBook: {
			Bitfinex: (response, market) => {
				return parseOrderBook(
					response.bids,
					response.asks,
					item => {
						return {
							price: parseFloat(item.price),
							amount: parseFloat(item.amount)
						}
					}
				);
			},
			Bittrex: (response, market) => {
				return parseOrderBook(
					response.bids.result,
					response.asks.result,
					item => {
						return {
							price: item.Rate,
							amount: item.Quantity
						}
					}
				);
			},
			Kraken: (response, market) => {
				return parseOrderBook(
					data.result[market].bids,
					data.result[market].asks,
					item => {
						return {
							price: parseFloat(item[0]),
							amount: parseFloat(item[1])
						}
					}
				);
			},
			Wex: (response, market) => {
				return parseOrderBook(
					response[market].bids,
					response[market].asks,
					item => {
						return {
							price: parseFloat(item[0]),
							amount: parseFloat(item[1])
						}
					}
				);
			},
			Poloniex: (response, market) => {
				return parseOrderBook(
					response.bids,
					response.asks,
					item => {
						return {
							price: engineerNumberToString(item[0]),
							amount: engineerNumberToString(item[1])
						}
					}
				);
			},
		},
		trades: {
			Bitfinex: (response, market) => {
				return response.map(item => {
					return {
						id: item.tid,
						price: parseFloat(item.price),
						amount: parseFloat(item.amount),
						type: item.type,
						timestamp: item.timestamp,
						time: getTime(item.timestamp * 1000)
					};
				});
			},
			Bittrex: (response, market) => {
				return response.map(item => {
					return {
						id: item.Id,
						price: item.Price,
						amount: item.Quantity,
						type: item.OrderType,
						timestamp: item.TimeStamp,
						time: getTime(item.TimeStamp)
					};
				});
			},
			Kraken: (response, market) => {
				return response.result[market].slice(-1*config.tradesDepth).reverse().map(item => {
					return {
						id: item.tid,
						price: parseFloat(item[0]),
						amount: parseFloat(item[1]),
						type: item[3] == 's' ? 'sell' : 'buy',
						timestamp: item[2],
						time: getTime(item[2] * 1000)
					};
				});
			},
			Wex: (response, market) => {
				return response[market].map(item => {
					return {
						id: item.tid,
						price: parseFloat(item.price),
						amount: parseFloat(item.amount),
						type: item.type == 'ask' ? 'sell' : 'buy',
						timestamp: item.timestamp,
						time: getTime(item.timestamp * 1000)
					};
				});
			},
			Poloniex: (response, market) => {
				return response.map(item => {
					return {
						price: parseFloat(item.rate),
						amount: parseFloat(item.amount),
						type: item.type,
						timestamp: item.date,
						time: getTime(item.date)
					};
				});
			},
		},
		candels: {
			Bitfinex: (response, depth) => {
				return;
			},
			Bittrex: (response, depth) => {
				return;
			},
			Kraken: (response, depth) => {
				return;
			},
			Wex: (response, depth) => {
				return;
			},
			Poloniex: (response, depth) => {
				return;
			},
		}
	}

	function getTime(value) {
		let date = new Date(value),
			offset = date.getTimezoneOffset(),
			time = [
				date.getHours(), // - offset / 60,
				date.getMinutes(),
				date.getSeconds()
			].map(item => {
				return item < 10 ? `0${item}` : item;
			}).join(':');

		return time;
	}

	function parseOrderBook(bids, asks, mapFunction) {
		return {
			bids: bids.map(mapFunction),
			asks: asks.map(mapFunction)
		};
	}

	function engineerNumberToString(number) {
		let strNumber = number.toString();
		if (strNumber.indexOf('e') == -1) {
			return number;
		}
		let e = strNumber.split('e'),
			precision = e[1].slice(1);

		return parseFloat(number).toFixed(precision);
	}

	function parseTicker(src, map) {
		return {
			ask: roundDecimal(src[map[0]], 1),
			bid: roundDecimal(src[map[1]], 1),
			last: roundDecimal(src[map[2]], 1),
			low: roundDecimal(src[map[3]], 1),
			high: roundDecimal(src[map[4]], 1),
			volume: roundDecimal(src[map[5]], 1) // from return24hVolume
		};
	}

	function roundDecimal(number, precision) {
		let factor = Math.pow(10, precision),
			e = number.toString().split('e'),
			digits = e.length > 1 ? +e[1].slice(1) + e[0].split('.').length - 1 : 0,
			fix = e.length > 1 ? parseFloat(number).toFixed(digits) : number,
			tmp = fix * factor,
			rounded = Math.round(tmp);

		return parseInt(fix) ? rounded / factor : fix;
	}

	function getInterval(exchange, minutes) { // 1, 5, 30, 60, 60*24 = 1440
		let intervals = {
			Bitfinex: { '1':'1m', '5':'5m', '30':'30m', '60':'1h', '1440':'1D' }, // ['1m', '5m', '15m', '30m', '1h', '3h', '6h', '12h', '1D', '7D', '14D', '1M'],
			Bittrex: { '1':'oneMin', '5':'fiveMin', '30':'thirtyMin', '60':'Hour', '1440':'Day' }, // ['oneMin', 'fiveMin', 'thirtyMin', 'Hour', 'Day'],
			Kraken: minutes,
			Poloniex: minutes * 60
		}
		let interval = intervals[exchange];

		return isNaN(interval) ? interval[minutes+''] : interval;
	}

	let methods = {
		getExchanges: () => Object.keys(urlParts),

		parse: (exchange, market, method, response) => {
			//console.log('------', exchange, market, method, 'parse data:', response.data);
			return response.data ? parse[method][exchange](response.data, market) : null;
		},

		ticker: (exchange, market) => $http.post('/getTickData', {
			exchange,
			market,
			action: 'ticker'
		}),

		orderBook: (exchange, market) => $http.post('/getTickData', {
			exchange,
			market,
			action: 'orderBook'
		}),

		trades: (exchange, market) => $http.post('/getTickData', {
			exchange,
			market,
			action: 'trades'
		}),

		candels: (exchange, market, minutes) => {
			if (exchange == 'Wex') {
				return $http.post('/cors', {
					url: makeURL(exchange, 'trades', { market, depth: 5000 })
				});
			} else {
				let now = new Date();
				let start = now.setDate(now.getDate() - 30)/ 1000;
				let interval = getInterval(exchange, minutes);

				return $http.post('/cors', {
					url: makeURL(exchange, 'candels', { market, start, interval })
				});
			}
		}
	};

	return methods;
});