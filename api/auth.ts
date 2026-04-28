import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkRateLimit,
  createAuthToken,
  getRequestMeta,
  isAllowedOrigin,
} from './_security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const meta = getRequestMeta(req);
  const origin = meta.origin;

  if (!isAllowedOrigin(origin, meta.host, meta.referer)) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = meta.ip || '127.0.0.1';
  if (!checkRateLimit(ip, 'auth')) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  const tokenData = createAuthToken(meta);
  if (!tokenData) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(tokenData);
}
