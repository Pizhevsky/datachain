var now = new Date(),
	offset = now.getTimezoneOffset(),
	end = new Date('2017-12-07'),
	timer = end.getTime() + offset*60*1000;// - now.getTime();

var cd = new Countdown({
	cont: document.querySelector('.container'),
	endDate: timer,
	outputTranslation: {
		day: 'Days',
		hour: 'Hours',
		minute: 'Minutes',
		second: 'Seconds',
	},
	endCallback: null,
	outputFormat: 'day|hour|minute|second',
});
cd.start();