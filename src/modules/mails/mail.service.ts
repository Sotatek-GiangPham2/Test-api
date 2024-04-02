import { Injectable } from '@nestjs/common';
import { utc } from 'moment';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
	static mailQueue;
	constructor(private readonly mailerService: MailerService) {}

	async resetPassword(to: string, data: any) {
		const date = utc(new Date()).format('YYYY-MM-DD HH:mm:ss(UTC)');
		data = {
			date,
			...data,
		};
		console.log('Start sent mail reset password', to, data);

		await this.mailerService.sendMail({
			to,
			subject: `[Flostream] Reset password`,
			template: 'reset-pass',
			context: data,
		});
		console.log('End sent mail reset password');
	}
}
