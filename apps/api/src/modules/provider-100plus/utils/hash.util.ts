import { createHmac } from 'node:crypto';

/** PHP `json_encode($param, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)`. */
export function encodePhpUnescapedJson(value: object): string {
  return JSON.stringify(value).replace(/\\u2028/g, '\u2028').replace(/\\u2029/g, '\u2029');
}

/** HMAC-SHA256 hex matching 100Plus PHP `getHash($param, $APIAuthorizationCode, $secretkey)`. */
export function generateHash(body: object, authCode: string, secretKey: string): string {
  const key = `${authCode}${secretKey}`;
  const message = encodePhpUnescapedJson(body);
  return createHmac('sha256', key).update(message, 'utf8').digest('hex');
}
