import { Module } from '@nestjs/common';
import { FileConsole } from './file.console';

@Module({
	// imports: [TypeOrmModule.forFeature([BlockRepository, UserRepository])],
	providers: [FileConsole],
})
export class FileConsoleModule {}
