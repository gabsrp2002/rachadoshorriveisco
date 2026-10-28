import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE, dynamic } from '@/app/api/[[...slug]]/route';
import { getSessionUser, decodeSession } from '@/lib/auth/session';

vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>();
  return {
    ...actual,
    SESSION_COOKIE_NAME: 'racha_session',
    getSessionUser: vi.fn(),
    decodeSession: vi.fn().mockResolvedValue(null),
  };
});

function params(slug?: string[]) {
  return { params: Promise.resolve({ slug }) };
}

describe('catch-all [[...slug]] API dispatcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should be configured with dynamic = force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('should route GET /api/health and attach x-request-id header', async () => {
    const req = new Request('http://localhost:3000/api/health');
    const res = await GET(req, params(['health']));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toMatch(/^[0-9a-f]{8}$/);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('rachadoshorriveisco');
  });

  it('should route GET /api/auth/me to the auth_me handler', async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/auth/me');
    const res = await GET(req, params(['auth', 'me']));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ authenticated: false });
  });

  it('should return 405 for known path with unsupported method', async () => {
    const req = new Request('http://localhost:3000/api/auth/me', { method: 'DELETE' });
    const res = await DELETE(req, params(['auth', 'me']));
    expect(res.status).toBe(405);
  });

  it('should return 404 for unknown paths', async () => {
    const req = new Request('http://localhost:3000/api/unknown/route');
    const res = await GET(req, params(['unknown', 'route']));
    expect(res.status).toBe(404);
  });

  it('should log start/finish lines with authenticated user tag when session cookie is valid', async () => {
    vi.mocked(decodeSession).mockResolvedValueOnce({
      userId: 'usr-1',
      username: 'jogador1',
      email: 'jogador1@racha.com',
      role: 'player',
      permissions: [],
      iat: Date.now(),
      exp: Date.now() + 60000,
    });

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const req = new Request('http://localhost:3000/api/health', {
      headers: { cookie: 'racha_session=valid-token' },
    });
    const res = await GET(req, params(['health']));
    const requestId = res.headers.get('x-request-id');
    const lines = spy.mock.calls.map((call) => String(call[0]));
    expect(lines).toContain(
      `[api:${requestId}] GET health (jogador1@racha.com (usr-1) [player]) started`
    );
  });
});
