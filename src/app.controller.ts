import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('/health-check')
	@ApiOperation({
		summary: 'Check is server work corecctly!',
	})
	getHello(): string {
		return this.appService.getHello();
	}
}
