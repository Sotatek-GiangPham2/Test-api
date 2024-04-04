import { Controller, Get } from '@nestjs/common';

@Controller('api/cron')
export class CronController {
  @Get()
  getCronData(): string {
    // Xử lý logic ở đây và trả về dữ liệu
    return 'Hello from Giang';
  }
}
