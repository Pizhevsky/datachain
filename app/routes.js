"use strict";

var authController = require('./controllers/authController');
var balanceController = require('./controllers/balanceController');
var exchangeController = require('./controllers/exchangeController');
var verificationController = require('./controllers/verificationController');

module.exports = function(app, passport) {

	app.get('/dashboard', isLoggedInRedirect, authController.dashboard);

	app.get('/', isLoggedInRedirect, (req, res, next) => res.redirect('/dashboard'));

	app.get('/login', authController.login);

	app.post('/signup', (req, res, next) => authController.signup(passport, req, res, next));

	app.post('/signin', (req, res, next) => authController.signin(passport, req, res, next));

	app.get('/logout', authController.logout);

	app.get('/verifyEmail/:token', authController.verifyUser);
	
	app.post('/resetPassword', authController.resetPassword);
	app.get('/verifyReset/:token', authController.verifyReset);
	app.post('/confirmReset', authController.confirmReset);
	app.post('/changePassword', isLoggedIn, authController.changePassword);

	app.post('/checkSecret2FA', verificationController.checkSecret2FA);
	app.post('/getSecret2FA', isLoggedIn, verificationController.getSecret2FA);
	app.post('/setSecret2FA', isLoggedIn, verificationController.setSecret2FA);
	app.post('/resetSecret2FA', isLoggedIn, verificationController.resetSecret2FA);

	app.post('/getUserReferals', isLoggedIn, verificationController.getUserReferals);
	app.post('/getWalletData', isLoggedIn, verificationController.getWalletData);
	app.post('/getHistoryData', isLoggedIn, verificationController.getHistoryData);
	app.post('/getUserData', isLoggedIn, verificationController.getUserData);
	app.post('/setUserData', isLoggedIn, verificationController.setUserData);
	app.post('/sendWithdrawEmail', isLoggedIn, verificationController.sendWithdrawEmail);
	app.get('/verifyWithdraw/:token', verificationController.verifyWithdraw);

	app.post('/phoneConfirm', isLoggedIn, verificationController.getPhoneCode);
	app.post('/phoneCodeConfirm', isLoggedIn, verificationController.phoneCodeConfirm);
	
	app.post('/getExchangesList', isLoggedIn, exchangeController.getExchangesList);
	app.post('/getExchangeInfo', isLoggedIn, exchangeController.getExchangeInfo);
	app.post('/newOrder', isLoggedIn, exchangeController.newOrder);
	app.post('/cancelOrder', isLoggedIn, exchangeController.cancelOrder);
	app.post('/getTickData', isLoggedIn, exchangeController.getTickData);
	app.post('/getUserTradeData', isLoggedIn, exchangeController.getUserData);
	app.post('/getDepositAddress', isLoggedIn, exchangeController.getDepositAddress);
	app.post('/getWithdrawInfo', isLoggedIn, exchangeController.getWithdrawInfo);
	app.post('/withdraw', isLoggedIn, exchangeController.withdraw);
	app.post('/getArbitrageInfo', isLoggedIn, exchangeController.getArbitrageInfo);
	
	app.post('/cors', exchangeController.cors);

	app.post('/sendCurrency', isLoggedIn, balanceController.sendCurrency);
	app.post('/api/wallets/:currency', balanceController.onWalletUpdate);


	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			console.log(req.user && req.user.id, req.url);
			return next();
		}

		res.send({ success: false, logout: true });
	}

	function isLoggedInRedirect (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}

		res.redirect('/login');
	}
}