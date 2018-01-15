angular.module('dashboardApp').controller('arbitrageController', function($scope, $http, Starter) {
	$scope.errorMessage = '';
	$scope.action = 'buy';
	$scope.currency = 'BTC';
	$scope.isSending = false;
	$scope.isExchangesLoaded = false;
	$scope.exchangeLoading = 'Bitfinex';
	$scope.bookChart = {};
	$scope.mixPrice = 0;

	$scope.changeAction = function(name) {
		$scope.action = name;
	};

	$scope.mix = function () {};

	let exchangesModel = [];

	let exchangesList = [];
	let excludeExchangesList = [];
	let sendedOrders = [];
	let tick = {};
	let book = {};
	let watcher;

	function init(options) {
		console.log('arbitrage init');
		$scope.model = {
			exchanges: [],
			orders: []
		};

		$scope.model.order = {
			type: 'market',
			amount: 1,
			price: 0,
			fee: 0.2
		};

		let arbScroll = new PerfectScrollbar('#arbScrollbar');

		console.log('watcher:', watcher);
		if (watcher) watcher();
		watcher = $scope.$watchGroup(['currency', 'action', 'model.order.amount'],
			value => {
				calcProfit($scope.model.exchanges);
			}
		);
	}

	$scope.$watch(
		scope => $scope.$parent.currentPage,
		value => {
			if (value == 'arbitrage') {
				init({});
				console.log('arbitrage page started');
				start();
			}
		}
	);

	function start() {
		post('/getExchangesList', {}, function(response) {
			exchangesList = response;

			Starter.init({
				market: 'BTC-USD',
				exchanges: exchangesList,
				includes: ['ticker', 'orderBook']
			});

			Starter.onTick( (exchange, market, data) => {
				tick[exchange] = data;
				calcProfit();
			});

			Starter.onOrderBook( (exchange, market, data) => {
				book[exchange] = data;
				$scope.bookChart = book;
				calcProfit();
				// calcBook();
				// calcMix();
			});

			// Starter.onTrade( (exchange, market, data) => {
			// 	console.log('trade:', data);
			// });

			exchangesList.forEach(exchange => {
				updatePersonal(exchange);
			})
		});
	}

	function updatePersonal(exchangeName) {
		post('/getArbitrageInfo', { exchange: exchangeName }, function(response) {
			let find = exchangesModel.findIndex(item => item.name == exchangeName);

			if (find == -1) {
				exchangesModel.push(response);
			} else {
				angular.extend(exchangesModel[find], response);
			}

			update();
		});
	}

	function update() {
		let orders = [];

		exchangesModel.forEach(item => {
			orders = orders.concat(item.orders);
		});

		orders = orders.map(item => {
			let date = new Date(item.timestamp);
			item.time = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

			let index = sendedOrders.indexOf(item.id);
			if (index != -1) {
				sendedOrders.splice(index, 1);
			}
			return item;
		});

		exchangesModel = exchangesModel.sort((a,b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});

		calcProfit();

		$scope.model.orders = orders.sort((a,b) => {
			if (a.timestamp < b.timestamp) return 1;
			if (a.timestamp > b.timestamp) return -1;
			return 0;
		});
		$scope.isOrdersUpdating = sendedOrders.length;
		checkLoader();
	};

	function checkLoader() {
		let pendingExchanges = exchangesList.slice();

		function exclude(name) {
			pendingExchanges = pendingExchanges.filter(item => item !== name);
		}
		exchangesModel.forEach( item => exclude(item.name) );
		excludeExchangesList.forEach(exclude);

		$scope.exchangeLoading = pendingExchanges[0];
		$scope.isExchangesLoaded = !pendingExchanges.length;
	}

	function calcProfit() {
		let minValue = 1000000000,
			maxValue = 0,
			amount = $scope.model.order.amount || 0,
			isDirect =  $scope.currency == 'BTC', // !isDirect === $scope.currency == 'USD'
			precision =  isDirect ? 100 : 1000000,
			sign = $scope.action == 'buy' && !isDirect
				|| $scope.action == 'sell' && isDirect
				? -1
				: 1;

		function countByLast(val, item) {
			if (!tick[item.name]) {
				return 0;
			}
			let fee = (1 + sign * item.fees.taker / 100),
				price = isDirect
					? val * tick[item.name].last
					: val / tick[item.name].last;

			return price * fee;
		}

		function countByOrderBook(val, item) {
			if (!book[item.name]) {
				return 0;
			}

			let bookSample = getBookSample(book[item.name], val, false);

			let fee = (1 + sign * item.fees.taker / 100),
				price = isDirect
					? val * bookSample
					: val / bookSample;

			item.priceByOrderBook = (price / val).toFixed(2);
			return price * fee;
		}

		let fees = {};
		exchangesModel.forEach(item => {
			item.tickerLast = tick[item.name] ? tick[item.name].last : 0;
			let priceFee = countByOrderBook(amount, item);
			item.priceFee = priceFee;
			item.priceFeeRound = Math.round(precision * priceFee) / precision;

			let ch = amount == 0 ? countByOrderBook(1, item) : priceFee;
			minValue = Math.min(ch, minValue);
			maxValue = Math.max(ch, maxValue);

			fees[item.name] = item.fees.taker;
		});

		exchangesModel.forEach(item => {
			let price = item.priceFee || countByOrderBook(1, item);

			item.buyDiff = Math.round(100000 * (price / (isDirect ? minValue : maxValue) - 1)) / 1000;
			item.sellDiff = Math.round(100000 * (price / (isDirect ? maxValue : minValue) - 1)) / 1000;
		});

		if (Object.keys(book).length) {
			let commonBook = getCommonBook();
			let mixSample = getBookSample(commonBook, amount, true),
				mixVal = 0;

			mixSample.forEach(item => {
				let fee = (1 + sign * fees[item.exchange] / 100),
					val = item.amount,
					bookSample = item.price,
					price = isDirect
						? val * bookSample
						: val / bookSample;
				mixVal += price*fee;
			});

			$scope.mixPrice = isNaN(mixVal) ? 0 : mixVal.toFixed(2);

			console.log('mixVal:', mixVal, mixSample);
		}

		$scope.model.exchanges = exchangesModel;
	}

	function getBookSample(book, num, withEx) {
		let type = $scope.action == 'buy' ? 'asks' : 'bids',
			arr = book[type],
			total = num,
			exchanges = [],
			accum = 0,
			i = 0;

		while (num > 0 && i < arr.length) {
			let a = arr[i].amount;
			let v = (num < a ? num : a) * arr[i].price;

			exchanges.push({
				price: arr[i].price,
				amount: num < a ? num : a,
				exchange: arr[i].exchange
			});

			num = num - a;
			accum = accum + v;
			i++;
		}

		if (num > 0) {
			console.error(`OrderBook depth isn't enough!`);
		}
		if (num < 0) {
			num = 0;
		}

		let price = Math.round(100 * accum / (total-num)) / 100;

		return withEx
			? exchanges
			: price;
	}

	function getCommonBook() {
		let commonBook = { bids: [], asks: [] };
		console.log('getCommonBook book:',book);
		Object.keys(book).forEach(key => {
			let itemBook = {
				bids: book[key].bids.map(item => {
					item.exchange = key;
					item.price = parseFloat(item.price);
					return item;
				}),
				asks:  book[key].asks.map(item => {
					item.exchange = key;
					item.price = parseFloat(item.price);
					return item;
				}),
			};

			commonBook.bids = commonBook.bids.concat(itemBook.bids);
			commonBook.asks = commonBook.asks.concat(itemBook.asks);
		});

		commonBook.bids.sort((a,b) => {
			if (a.price < b.price) return 1;
			if (a.price > b.price) return -1;
			return 0;
		});
		commonBook.asks.sort((a,b) => {
			if (a.price < b.price) return -1;
			if (a.price > b.price) return 1;
			return 0;
		});

		return commonBook;
	}

	$scope.buy = function (exchange) {
		// sendOrder('buy', exchange, function(response) {
		// 	sendedOrders.push(response.orderId);
		// 	$scope.isSending = false;
		// 	updatePersonal(exchange);
		// });
	};

	$scope.sell = function (exchange) {
		// sendOrder('sell', exchange, function(response) {
		// 	sendedOrders.push(response.orderId);
		// 	$scope.isSending = false;
		// 	updatePersonal(exchange);
		// });
	};

	function sendOrder(side, exchange, cb) {
		$scope.isSending = true;

		let order = $scope.model.order;

		if (!order.amount) {
			showErrorMessage('Please set amount!');
			return false;
		}
		// if (order.type == 'limit' && !order.price) {
		// 	showErrorMessage('Please set price!');
		// 	return false;
		// }
		let amount = $scope.currency == 'USD' ? order.amount / tick[exchange.name].last : order.amount;

		console.log('sendOrder exchange:', exchange);

		let data = {
			exchange: exchange.name,
			market: exchange.market,
			amount: amount.toString(),
			type: order.type,
			price: (order.price || tick[exchange.name].last).toString(),
			side: side
		};
		console.log('sendOrder data:', data);
		post('/newOrder', data, function(response) {
			cb(response);
		});
	}

	let errorsCount = 0;

	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response && response.success) {
					errorsCount = 0;
					cb(response.data);
				} else {
					errorsCount++;
					console.error(url, data, 'response error:', response);
					if (url == '/getArbitrageInfo') {
						//showErrorMessage(`Exchange ${data.exchange} doesn't response. Try again!`);
						if (errorsCount < 20) {
							setTimeout(() => post(url, data, cb), 1000);
						} else {
							excludeExchangesList.push(data.exchange);
							checkLoader();
							Starter.changeExchanges(data.exchange, true);
							showErrorMessage(`Exchange ${data.exchange} not available!`);
						}
						return;
					}

					$scope.isSending = false;
					if (response) {
						if (response.message == 'ERR_RATE_LIMIT') {
							if (url == '/newOrder') {
								showErrorMessage(`Exchange doesn't response. Try again!`);
							}
							return;
						}
						if (response.message == 'URL request error') { }
						if (response.message) {
							showErrorMessage(response.message);
						}
					}
				}
			})
			.error(function(response) {
				console.error('error:', response);
				$scope.isSending = false;
				if (response && response.message) {
					if (response.message == 'ERR_RATE_LIMIT') {
						if (url == '/newOrder') {
							showErrorMessage(`Exchange doesn't response. Try again!`);
						}
						return;
					}
					showErrorMessage(response.message);
				}
			});
	}

	function showErrorMessage(message) {
		$scope.errorMessage = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.errorMessage = '';
			});
		}, 5000);
	}
});