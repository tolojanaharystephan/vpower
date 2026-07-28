import { randomUUID } from 'node:crypto';
import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '../constants';

export type RequestWithIds = Request & {
  correlationId: string;
  requestId: string;
};

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming =
      (req.header(CORRELATION_ID_HEADER) || req.header(REQUEST_ID_HEADER) || '').trim() ||
      randomUUID();
    const requestId = randomUUID();

    const request = req as RequestWithIds;
    request.correlationId = incoming;
    request.requestId = requestId;

    res.setHeader(CORRELATION_ID_HEADER, incoming);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
