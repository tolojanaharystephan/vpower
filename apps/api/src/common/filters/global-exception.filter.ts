import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody } from '@vpower777/types';
import type { RequestWithIds } from '../middleware/correlation-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithIds>();

    const correlationId = request.correlationId ?? request.headers['x-correlation-id'];
    const { statusCode, code, message, details } = this.normalize(exception);

    const body: ApiErrorBody = {
      statusCode,
      code,
      message,
      correlationId: typeof correlationId === 'string' ? correlationId : undefined,
      ...(details !== undefined ? { details } : {}),
    };

    if (statusCode >= 500) {
      this.logger.error(
        {
          correlationId: body.correlationId,
          path: request.url,
          method: request.method,
          statusCode,
          code,
          err: exception instanceof Error ? exception.message : exception,
        },
        'Unhandled server error',
      );
    } else {
      // Browser noise — don't spam logs for favicon / empty probes
      const quiet =
        request.url === '/favicon.ico' ||
        request.url?.startsWith('/favicon.ico?');
      if (!quiet) {
        this.logger.warn(
          {
            correlationId: body.correlationId,
            path: request.url,
            method: request.method,
            statusCode,
            code,
          },
          message,
        );
      }
    }

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return {
          statusCode,
          code: this.codeFromStatus(statusCode),
          message: payload,
        };
      }

      if (typeof payload === 'object' && payload !== null) {
        const obj = payload as Record<string, unknown>;
        const message = this.extractMessage(obj.message) || exception.message;
        const details = obj.message !== message ? obj.message : undefined;

        return {
          statusCode,
          code:
            typeof obj.code === 'string' ? obj.code : this.codeFromStatus(statusCode),
          message,
          details: Array.isArray(details) ? details : undefined,
        };
      }

      return {
        statusCode,
        code: this.codeFromStatus(statusCode),
        message: exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
  }

  private extractMessage(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
    }
  }
}
