import { Controller, Get } from '@nestjs/common';
import { SkipAuth } from '../../common/decorators';

@Controller('health')
export class HealthController {
  @SkipAuth()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
