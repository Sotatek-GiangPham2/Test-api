import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailModule } from '../mails/mail.module';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
	imports: [
		JwtModule.register({
			global: true,
		}),
		SharedModule,
		MailModule,
	],
	providers: [AuthService, JwtService],

	controllers: [AuthController],
})
export class AuthModule {}
