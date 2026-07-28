import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API_PREFIX } from '@vpower777/config';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import { AppModule } from './app.module';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from './common/constants';
import type { RequestWithIds } from './common/middleware/correlation-id.middleware';
import { setupSwagger } from './common/swagger';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: false,
  });
  const config = app.get(AppConfigService);

  // Apply early so unmatched routes / favicon also get correlation IDs
  app.use((req: RequestWithIds, res: Response, next: NextFunction) => {
    const incoming =
      (req.header(CORRELATION_ID_HEADER) || req.header(REQUEST_ID_HEADER) || '').trim() ||
      randomUUID();
    const requestId = randomUUID();
    req.correlationId = incoming;
    req.requestId = requestId;
    res.setHeader(CORRELATION_ID_HEADER, incoming);
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-correlation-id',
      'x-request-id',
    ],
    exposedHeaders: ['x-correlation-id', 'x-request-id'],
  });

  const prefix = API_PREFIX.replace(/^\//, '');
  app.setGlobalPrefix(prefix, {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'docs', method: RequestMethod.GET },
      { path: 'docs-json', method: RequestMethod.GET },
      { path: 'favicon.ico', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );

  setupSwagger(app);

  const port = config.apiPort;
  await app.listen(port);

  console.log(`[api] listening on http://localhost:${port}`);
  console.log(`[api] root:     http://localhost:${port}/`);
  console.log(`[api] health:   http://localhost:${port}/health`);
  console.log(`[api] swagger:  http://localhost:${port}/docs`);
  console.log(`[api] prefix:   /${prefix}`);
}

void bootstrap();
