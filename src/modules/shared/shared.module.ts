import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import config from '../../../src/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: config,
		}),

		ClientsModule,
	],
	providers: [],
	exports: [ConfigModule, ClientsModule],
})
export class SharedModule {}
