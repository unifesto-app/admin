const SESSION_COOKIE_NAME = 'uf_admin_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  sub: string;
  exp: number;
};

const encoder = new TextEncoder();

const base64UrlEncode = (input: string) => {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + pad);
};

const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

const sign = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const signatureBytes = new Uint8Array(signature);
  let binary = '';
  signatureBytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return base64UrlEncode(binary);
};

const readSecret = () => process.env.ADMIN_CONSOLE_AUTH_SECRET ?? '';

export const getAuthCookieName = () => SESSION_COOKIE_NAME;

export const getCookieMaxAge = () => DEFAULT_TTL_SECONDS;

export const isAuthConfigured = () => {
  return Boolean(
    process.env.ADMIN_CONSOLE_USERNAME &&
    process.env.ADMIN_CONSOLE_PASSWORD &&
    readSecret()
  );
};

export const verifyAdminCredentials = (username: string, password: string) => {
  const expectedUsername = process.env.ADMIN_CONSOLE_USERNAME;
  const expectedPassword = process.env.ADMIN_CONSOLE_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  return username === expectedUsername && password === expectedPassword;
};

export const createSessionToken = async (subject: string) => {
  const secret = readSecret();
  if (!secret) {
    throw new Error('ADMIN_CONSOLE_AUTH_SECRET is not configured');
  }

  const payload: SessionPayload = {
    sub: subject,
    exp: Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS,
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
};

export const verifySessionToken = async (token: string | undefined | null) => {
  if (!token) return false;
  const secret = readSecret();
  if (!secret) return false;

  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return false;

  const expectedSignature = await sign(payloadEncoded, secret);
  if (!constantTimeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};
