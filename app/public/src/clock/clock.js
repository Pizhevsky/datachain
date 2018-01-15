var now = new Date(),
	offset = now.getTimezoneOffset(),
	end = new Date('2017-12-07'),
	timer = end.getTime() + offset*60*1000 - now.getTime();

var clock = new FlipClock($('.clock'), timer/1000, {
	countdown: true,
	clockFace: 'DailyCounter',

	// The onStart callback
	onStart: function() {
		// Do something
	},

	// The onStop callback
	onStop: function() {
		// Do something
	},

	// The onReset callback
	onReset: function() {
		// Do something
	}
});