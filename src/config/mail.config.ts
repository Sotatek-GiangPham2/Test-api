export default () => ({
	mail: {
		mailUser: process.env.MAIL_USER,
		mailPassword: process.env.MAIL_PASS,
		mailFrom: process.env.MAIL_FORM,
		mailHost: process.env.MAIL_HOST,
		mailPort: process.env.MAIL_PORT,
	},
});
