import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    '/(fr|en|es|nl|zh|ko|ja|mn)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
