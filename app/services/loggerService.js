"use strict";

var log4js = require('log4js');



log4js.configure({
	appenders: {
		'cheese': { type: 'file', filename: 'info.log' },
		'console': { type:'console' }
	},
	categories: {
		default: { appenders: ['console','cheese'], level: 'trace' }
	}
});

module.exports = log4js.getLogger('cheese');