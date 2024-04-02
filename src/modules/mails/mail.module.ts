import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
	imports: [
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => {
				return {
					transport: {
						host: config.get('mail.mailHost'),
						secure: false,
						auth: {
							user: config.get('mail.mailUser'),
							pass: config.get('mail.mailPassword'),
						},
						tls: {
							rejectUnauthorized: false,
						},
					},
					defaults: {
						from: `"No Reply" <${config.get('mail.mailFrom')}>`,
					},
					template: {
						dir: join(__dirname, 'templates'),
						adapter: new HandlebarsAdapter(undefined, {
							inlineCssEnabled: true,
						}),

						options: {
							strict: true,
						},
					},
				};
			},
			inject: [ConfigService],
		}),
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
