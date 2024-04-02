require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as httpContext from 'express-http-context';
import { ConfigService } from '@nestjs/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import basicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	app.enableCors();
	const appPort = process.env.APP_PORT;
	app.use(httpContext.middleware);
	app.useGlobalPipes(new ValidationPipe({ transform: true }));
	app.setGlobalPrefix(configService.get('app.prefixUrl'));

	await _setupSwagger(app);

	await app.listen(appPort, () => {
		console.log(`${configService.get('app.name')} running on http://localhost:${appPort}`);
		console.log(`swagger: http://localhost:${appPort}${configService.get('app.swagger.path')}`);
	});
}
async function _setupSwagger(app: INestApplication) {
	const configService = app.get(ConfigService);
	const swaggerUser = configService.get('app.swagger.user');
	const swaggerPassword = configService.get('app.swagger.password');
	if (swaggerUser && swaggerPassword) {
		app.use(
			[configService.get('app.swagger.path')],
			basicAuth({
				challenge: true,
				users: {
					[swaggerUser as string]: swaggerPassword,
				},
			}),
		);
	}

	const docBuilder = new DocumentBuilder()
		.setTitle(configService.get('app.swagger.title'))
		.setDescription(configService.get('app.swagger.description'))
		.setVersion('1.0.0')
		.addBearerAuth()
		.addBasicAuth()
		.addSecurity('apiKey', configService.get('app.swagger.securities.apiKey'));

	const options = docBuilder.build();
	const document = SwaggerModule.createDocument(app, options);

	SwaggerModule.setup(configService.get('app.swagger.path'), app, document, {
		customSiteTitle: 'Flostream API',
	});
}

bootstrap();
