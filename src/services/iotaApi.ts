/**
 * IOTA API service — all external API calls live here.
 *
 * Every request goes through the Express proxy (/api/...)
 * so the RPC URL and any keys stay server-side.
 */

import { PROXY_BASE_URL } from './proxyConfig';
import type { ValidatorsResponse, RpcProxyRequest } from '../types';

// ─── Fetch helpers ──────────────────────────────────────────────

async function proxyGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PROXY_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function proxyPost<T>(path: string, body: RpcProxyRequest): Promise<T> {
  const res = await fetch(`${PROXY_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetches the combined validator + system state data.
 * This is the primary data source for the globe and sidebar.
 */
export async function fetchValidators(): Promise<ValidatorsResponse> {
  return proxyGet<ValidatorsResponse>('/validators');
}

/**
 * Generic JSON-RPC call through the proxy (whitelisted methods only).
 */
export async function rpcCall<T = unknown>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  return proxyPost<T>('/rpc', { method, params });
}

/**
 * Healthcheck — verifies that the proxy can reach the IOTA RPC node.
 */
export async function healthCheck(): Promise<{
  status: string;
  rpcUrl: string;
  referenceGasPrice: string;
}> {
  return proxyGet('/health');
}
