import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/authentications/auth.module';
import { FileModule } from './modules/files/file.module';
import { SharedModule } from './modules/shared/shared.module';
import { CronController } from './cron/cron.controller';

@Module({
	imports: [SharedModule, AuthModule, FileModule],
	controllers: [AppController, CronController],
	providers: [AppService],
})
export class AppModule {}
