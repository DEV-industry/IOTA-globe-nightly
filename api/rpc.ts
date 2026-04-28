import { VercelRequest, VercelResponse } from '@vercel/node';

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
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
