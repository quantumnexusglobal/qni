import crypto from 'crypto';
import { cookies } from 'next/headers';

const WRITER_COOKIE = 'qni_writer_session';
const ADMIN_COOKIE = 'qni_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.BLOG_SESSION_SECRET || process.env.ADMIN_ACCESS_TOKEN || 'qni-local-session-secret';
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createBlogSession(writer: { id: string; email: string; name: string; role: string }) {
  const payload = Buffer.from(JSON.stringify({ ...writer, exp: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyBlogSession(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export async function getBlogSession() {
  const store = await cookies();
  return verifyBlogSession(store.get(WRITER_COOKIE)?.value);
}

export async function hasAdminSession() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === 'true';
}

export function setBlogSession(response: Response, token: string) {
  response.headers.append(
    'Set-Cookie',
    `${WRITER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`
  );
}

export function clearBlogSession(response: Response) {
  response.headers.append('Set-Cookie', `${WRITER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
