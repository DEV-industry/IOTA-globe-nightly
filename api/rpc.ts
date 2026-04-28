import { VercelRequest, VercelResponse } from '@vercel/node';
import { isAllowedOrigin, isValidAuthToken, checkRateLimit } from './_security';

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

// Metody z API IOTA, z których realnie korzysta aplikacja
const ALLOWED_METHODS = [
  'iota_getCheckpoints',
  'iota_multiGetTransactionBlocks',
  'iotax_getLatestIotaSystemState',
  'iotax_getValidatorsApy'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  // 1. Zabezpieczenie CORS: Odrzuć żądanie, jeśli pochodzenie (origin) nie jest autoryzowane / puste
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Umożliwiamy Preflight (OPTIONS)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-App-Auth'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Autoryzacja App -> Proxy (Wymagany token!)
  const clientToken = req.headers['x-app-auth'];
  if (!isValidAuthToken(clientToken)) {
     return res.status(401).json({ error: 'Unauthorized communication' });
  }

  // 3. Rate Limiting dla danego IP klienta
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(ip as string)) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { method, params } = req.body;
    
    if (!method) {
      return res.status(400).json({ error: 'Missing method' });
    }

    if (!ALLOWED_METHODS.includes(method)) {
      return res.status(403).json({ error: 'Method Not Allowed via this Proxy' });
    }

    const rpcRes = await fetch(IOTA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: params || [],
      }),
    });

    if (!rpcRes.ok) {
      return res.status(rpcRes.status).json({ error: `RPC HTTP error ${rpcRes.status}` });
    }

    const data = await rpcRes.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in general RPC proxy:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
