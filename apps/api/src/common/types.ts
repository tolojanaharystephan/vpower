import type { Request } from 'express';

export type RequestWithIds = Request & {
  correlationId: string;
  requestId: string;
};
