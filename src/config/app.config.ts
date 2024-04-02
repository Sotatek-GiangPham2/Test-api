import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	name: process.env.APP_NAME || 'Flostream',
	env: process.env.APP_ENV || 'development',
	prefixUrl: ``,
	port: process.env.APP_PORT || 3500,
	swagger: {
		title: `Flostream`,
		description: `Swagger documentation`,
		version: process.env.SWAGGER_VERSION || '1.0.0',
		user: process.env.SWAGGER_USER || 'admin',
		password: process.env.SWAGGER_PASSWORD || '1',
		path: `/api-docs`,
	},
}));
