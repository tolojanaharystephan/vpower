import {
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export type Plus100ErrorAction = 'continue' | 'closeWindow' | 'retry';

export type Plus100ErrorBody = {
  status: 'error';
  code?: string | number;
  message?: string;
  action?: Plus100ErrorAction | string;
};

export class Plus100ApiException extends HttpException {
  constructor(
    public readonly plus100Code: string | number | undefined,
    public readonly action: Plus100ErrorAction | string | undefined,
    message: string,
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'PLUS100_API_ERROR',
        message,
        plus100Code,
        action,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function isPlus100ErrorBody(value: unknown): value is Plus100ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { status?: unknown }).status === 'error'
  );
}

export function toPlus100GatewayIfUnknown(err: unknown): never {
  if (err instanceof HttpException) throw err;
  throw new BadGatewayException({
    statusCode: HttpStatus.BAD_GATEWAY,
    code: 'PLUS100_BAD_GATEWAY',
    message: '100Plus API unreachable — check PLUS100_API_URL',
  });
}
