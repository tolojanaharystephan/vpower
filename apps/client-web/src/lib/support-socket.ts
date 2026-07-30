import { io, type Socket } from 'socket.io-client';
import { getApiBaseUrl } from './utils';

export function connectSupportSocket(accessToken: string): Socket {
  return io(`${getApiBaseUrl()}/support`, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
