import { VercelRequest, VercelResponse } from '@vercel/node';

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

// Metody z API IOTA, z których realnie korzysta aplikacja
const ALLOWED_METHODS = [
  'iota_getCheckpoints',
  'iota_multiGetTransactionBlocks',
  'iotax_getLatestIotaSystemState',
  'iotax_getValidatorsApy'
];

// Sprawdza, czy origin jest na liście dopuszczonych lub czy to domena sub-Vercelowa
function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true; // Zaufaj domenom Vercela Twojego projektu
  // W przypadku customowej domeny, dodaj poniżej:
  // if (origin === 'https://mojadomena.pl') return true;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  // Bezpieczny CORS
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Brak origin? Zostawiamy dla np. cURL
  } else {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
