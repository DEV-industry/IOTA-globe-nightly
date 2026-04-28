export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true; 
  // if (origin === 'https://twoja-domena.pl') return true;

  return false;
}

// Oczekiwany token z przeglądarki. W środowisku produkcyjnym 
// upewnij się, że Vercel ma ustawioną zmienną środowiskową PROXY_API_TOKEN
const EXPECTED_TOKEN = process.env.PROXY_API_TOKEN;

export function isValidAuthToken(token: string | string[] | undefined): boolean {
  if (!EXPECTED_TOKEN) return false; // Fail-safe na wypadek błędu w konfiguracji env
  return token === EXPECTED_TOKEN;
}

// Prosty in-memory Rate Limiting (Ostrzeżenie: w Vercel state jest resetowany per instancja)
// Dla większego bezpieczeństwa użyj np. @upstash/ratelimit uderzającego do Redis
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 60; // Max zapytan z jednego IP na minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rateLimitRecord = rateLimitMap.get(ip);
  
  if (!rateLimitRecord) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60000 });
    return true;
  }
  
  if (now > rateLimitRecord.expiresAt) {
    // Reset po upływie minuty
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60000 });
    return true;
  }
  
  if (rateLimitRecord.count >= MAX_REQUESTS_PER_MINUTE) {
    return false; // Limit przekroczony
  }
  
  rateLimitRecord.count += 1;
  return true;
}
