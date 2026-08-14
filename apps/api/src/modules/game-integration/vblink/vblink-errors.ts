import {
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/** 22 FastAPI PDF response codes. */
export const VBLINK_ERROR_MESSAGES: Record<number, string> = {
  200: 'Success',
  1: 'New User Is Created',
  2: 'User Does Not Exist',
  3: 'Parameter Error',
  4: 'Invalid Signature',
  5: 'Agent Ban',
  6: 'Account length error',
  7: 'Account format error',
  8: 'Password length error',
  9: 'Password format error',
  10: 'Requestid Used',
  11: 'Unknown Database Error',
  12: 'User Already Exist',
  13: 'Top Up Fail',
  14: 'Insufficient Credit',
  15: 'Withdrawal Failed',
  16: 'Get Balance Failed',
  17: 'Operations are Not Allowed In The Game',
  18: 'System Is Under Maintenance',
  19: 'The Requested Address Does Not Exist',
  20: 'Password error',
  21: 'Agent Name Or Password error',
  22: 'Platform Not Configured',
};

/** @deprecated Use VBLINK_ERROR_MESSAGES */
export const VBLINK_CODE_HINT = VBLINK_ERROR_MESSAGES;

const UNAVAILABLE_CODES = new Set([5, 11, 13, 15, 16, 17, 18, 22]);

/** Cloudflare / HTML 403 when calling the Game Mainpage instead of the FastAPI host. */
export class VblinkUpstreamBlockedException extends HttpException {
  constructor(url: string, status: number) {
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      /* keep url */
    }
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: 'VBLINK_UPSTREAM_BLOCKED',
        message:
          `VBlink blocked ${url} (HTTP ${status}, Cloudflare). ` +
          `${host} is the Game Mainpage, not the API Server Domain. ` +
          `Ask VBlink for the API Server Domain and whitelist this machine's public IP.`,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class VblinkApiException extends HttpException {
  constructor(
    public readonly vblinkCode: number,
    message?: string,
  ) {
    const hint = VBLINK_ERROR_MESSAGES[vblinkCode] || `VBlink error ${vblinkCode}`;
    const unavailable = UNAVAILABLE_CODES.has(vblinkCode);
    const status = unavailable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_REQUEST;
    super(
      {
        statusCode: status,
        code: 'VBLINK_API_ERROR',
        message: message || hint,
        vblinkCode,
      },
      status,
    );
  }
}

export function isVblinkSuccessCode(code: number, allow: number[] = []): boolean {
  return new Set([200, 1, ...allow]).has(code);
}

export function toGatewayIfUnknown(err: unknown): never {
  if (err instanceof HttpException) throw err;
  throw new BadGatewayException(
    'VBlink API unreachable — check VBLINK_API_BASE_URL and IP whitelist',
  );
}
