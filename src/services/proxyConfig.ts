/**
 * Proxy configuration — resolves the base URL for API calls.
 *
 * In dev, Vite proxies /api → localhost:3001 automatically.
 * In production, VITE_PROXY_BASE_URL should point to your
 * Vercel /api/ route or other serverless proxy URL.
 */

export const PROXY_BASE_URL: string =
  import.meta.env.VITE_PROXY_BASE_URL || '/api';
