import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

const DEFAULT_ALLOWED_HOSTS = [
  'localhost:5173',
  'localhost:3000',
];

function parseEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const ALLOWED_ORIGINS = [
  ...DEFAULT_ALLOWED_ORIGINS,
  ...parseEnvList(process.env.ALLOWED_ORIGINS),
];

export const ALLOWED_HOSTS = [
  ...DEFAULT_ALLOWED_HOSTS,
  ...parseEnvList(process.env.ALLOWED_HOSTS),
];

const AUTH_ISSUER = 'iota-globe';
const DEFAULT_TOKEN_TTL_SECONDS = 300;
const TOKEN_TTL_SECONDS = clampNumber(
  process.env.PROXY_TOKEN_TTL_SECONDS,
  60,
  3600,
  DEFAULT_TOKEN_TTL_SECONDS,
);

// Server secret required for auth token signing
const EXPECTED_TOKEN = process.env.PROXY_API_TOKEN;

const RATE_LIMITS = {
  auth: { max: 30, windowMs: 60_000 },
  validators: { max: 60, windowMs: 60_000 },
  rpc: { max: 120, windowMs: 60_000 },
};

export interface RequestMeta {
  origin?: string;
  host?: string;
  referer?: string;
  userAgent?: string;
  ip?: string;
}

interface AuthTokenPayload {
  iss: string;
  v: number;
  iat: number;
  exp: number;
  origin?: string;
  host?: string;
  uaHash: string;
  ipHash?: string;
  nonce: string;
}

function clampNumber(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function normalizeHost(host: string | undefined): string | undefined {
  return host ? host.toLowerCase() : undefined;
}

function getOriginFromReferer(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

function isAllowedHost(host: string | undefined): boolean {
  if (!host) return false;
  if (ALLOWED_HOSTS.includes(host)) return true;
  if (host.endsWith('.vercel.app')) return true;
  return false;
}

export function isAllowedOrigin(
  origin: string | undefined,
  host?: string | string[],
  referer?: string,
): boolean {
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (origin.endsWith('.vercel.app')) return true;
    return false;
  }

  const refererOrigin = getOriginFromReferer(referer);
  if (refererOrigin) {
    if (ALLOWED_ORIGINS.includes(refererOrigin)) return true;
    if (refererOrigin.endsWith('.vercel.app')) return true;
  }

  // Some same-origin requests omit the Origin header; fall back to Host.
  const resolvedHost = Array.isArray(host) ? host[0] : host;
  return isAllowedHost(normalizeHost(resolvedHost));
}

export function getRequestMeta(req: VercelRequest): RequestMeta {
  const origin =
    typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host;
  const host = normalizeHost(
    typeof hostHeader === 'string' ? hostHeader : undefined,
  );
  const referer =
    typeof req.headers.referer === 'string' ? req.headers.referer : undefined;
  const userAgent =
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : '';
  const ip = getClientIp(req);

  return { origin, host, referer, userAgent, ip };
}

function getClientIp(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0]?.trim() || '127.0.0.1';
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) return forwardedFor[0] ?? '127.0.0.1';
  return req.socket?.remoteAddress || '127.0.0.1';
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.padEnd(input.length + (4 - (input.length % 4 || 4)) % 4, '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function hashValue(value: string): string {
  return base64UrlEncode(createHash('sha256').update(value).digest());
}

function signToken(data: string): string {
  return base64UrlEncode(createHmac('sha256', EXPECTED_TOKEN || '').update(data).digest());
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function createAuthToken(meta: RequestMeta): { token: string; expiresAt: number } | null {
  if (!EXPECTED_TOKEN) return null;

  const issuedAt = nowSeconds();
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;

  const payload: AuthTokenPayload = {
    iss: AUTH_ISSUER,
    v: 1,
    iat: issuedAt,
    exp: expiresAt,
    origin: meta.origin,
    host: meta.host,
    uaHash: hashValue(meta.userAgent || ''),
    ipHash: meta.ip ? hashValue(meta.ip) : undefined,
    nonce: base64UrlEncode(randomBytes(12)),
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = signToken(data);

  return {
    token: `${data}.${signature}`,
    expiresAt: expiresAt * 1000,
  };
}

export function verifyAuthToken(
  token: string | string[] | undefined,
  meta: RequestMeta,
): boolean {
  if (!EXPECTED_TOKEN) return false;
  if (!token || Array.isArray(token)) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signature] = parts;
  if (!headerPart || !payloadPart || !signature) return false;

  const data = `${headerPart}.${payloadPart}`;
  const expectedSignature = signToken(data);
  if (!safeEqual(signature, expectedSignature)) return false;

  let payload: AuthTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart)) as AuthTokenPayload;
  } catch {
    return false;
  }

  if (payload.iss !== AUTH_ISSUER || payload.v !== 1) return false;
  const now = nowSeconds();
  if (typeof payload.exp !== 'number' || payload.exp < now) return false;
  if (typeof payload.iat !== 'number' || payload.iat - 60 > now) return false;

  if (payload.origin && meta.origin && payload.origin !== meta.origin) {
    return false;
  }

  if (payload.host) {
    if (!meta.host || payload.host !== meta.host) return false;
  }

  if (payload.uaHash !== hashValue(meta.userAgent || '')) return false;

  if (payload.ipHash && meta.ip && payload.ipHash !== hashValue(meta.ip)) {
    return false;
  }

  return true;
}

// In-memory rate limit (resets per instance)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(
  ip: string,
  bucket: keyof typeof RATE_LIMITS,
): boolean {
  const limit = RATE_LIMITS[bucket] ?? RATE_LIMITS.rpc;
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + limit.windowMs });
    return true;
  }

  if (now > record.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + limit.windowMs });
    return true;
  }

  if (record.count >= limit.max) {
    return false;
  }

  record.count += 1;
  return true;
}
