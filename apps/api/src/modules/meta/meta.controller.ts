import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { API_PREFIX, BRAND } from '@vpower777/config';
import { Public } from '../../common/decorators';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Browser-friendly root for localhost:4000 — this is an API, not a website.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller()
export class MetaController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  root() {
    const base = this.config.apiUrl.replace(/\/$/, '');
    return {
      service: `${BRAND.name} API`,
      status: 'ok',
      message: 'Backend API only — use the links below (not a frontend page).',
      links: {
        health: `${base}/health`,
        ready: `${base}/health/ready`,
        docs: `${base}/docs`,
        api: `${base}${API_PREFIX}`,
      },
    };
  }

  @Get('favicon.ico')
  @HttpCode(204)
  favicon(): void {
    return;
  }
}
