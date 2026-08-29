import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'Chancen API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
