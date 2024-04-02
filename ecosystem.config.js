require('dotenv').config();

module.exports = {
	apps: [
		{
			name: '[Flostream] File expited date',
			script: 'yarn console expire-date-file',
			log_date_format: 'YYYY-MM-DD HH:mm:ss',
			instances: 1,
			autorestart: false,
			time: true
		},
	],
};
