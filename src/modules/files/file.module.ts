import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mails/mail.module';
import { SharedModule } from '../shared/shared.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
	imports: [
		JwtModule.register({
			global: true,
		}),
		SharedModule,
		MailModule,
	],
	providers: [FileService],

	controllers: [FileController],
})
export class FileModule {}
