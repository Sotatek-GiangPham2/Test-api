import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { FileConsoleModule } from './modules/files/file.console.module';

@Module({
	imports: [ConsoleModule, FileConsoleModule],
	providers: [],
})
export class AppConsoleModule {}
