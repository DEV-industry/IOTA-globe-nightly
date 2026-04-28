/**
 * IOTA API service — all external API calls live here.
 *
 * Modified to route through the Vercel Serverless Functions proxy.
 */

import type { ValidatorsResponse } from '../types';

// ─── Config ─────────────────────────────────────────────────────

// Use proxy base URL from env if set, otherwise fallback to local /api (proxied in dev via Vite)
const PROXY_BASE_URL = import.meta.env?.VITE_PROXY_BASE_URL ?? '/api';
const PROXY_API_TOKEN = import.meta.env?.VITE_PROXY_API_TOKEN ?? '';

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetches the combined validator + system state data.
 * This is the primary data source for the globe and sidebar.
 * Calls our Vercel Serverless Function `/api/validators` which handles caching.
 */
export async function fetchValidators(): Promise<ValidatorsResponse> {
  const url = `${PROXY_BASE_URL.replace(/\/$/, '')}/validators`;
  const res = await fetch(url, {
    headers: {
      'x-app-auth': PROXY_API_TOKEN
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch validators proxy API: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Generic JSON-RPC call routed via our `/api/rpc` proxy.
 */
export async function rpcCall<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const url = `${PROXY_BASE_URL.replace(/\/$/, '')}/rpc`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-app-auth': PROXY_API_TOKEN 
    },
    body: JSON.stringify({ method, params }),
  });

  if (!res.ok) {
    throw new Error(`Proxy RPC HTTP error ${res.status}: ${res.statusText}`);
  }

  const data: JsonRpcResponse<T> = await res.json();

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}
