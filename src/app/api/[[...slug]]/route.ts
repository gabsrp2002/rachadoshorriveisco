import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { REQUEST_ID_HEADER } from '@/lib/api/request-log';
import { SESSION_COOKIE_NAME, decodeSession, formatSessionUserTag } from '@/lib/auth/session';
import { GET_auth_me } from '@/lib/api/handlers/auth_me';
import { GET_health } from '@/lib/api/handlers/health';

// Single-function API router: consolidates all /api/* handlers into one
// dispatcher entry so shared deps (Prisma, auth, services) are bundled once
// and every request gets unified request tracing.
export const dynamic = 'force-dynamic';

type SlugParams = { slug?: string[] };
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RouteHandler = (request: Request) => Promise<NextResponse>;

const ROUTE_TABLE: Record<string, Partial<Record<HttpMethod, RouteHandler>>> = {
  'auth/me': { GET: () => GET_auth_me() },
  health: { GET: () => GET_health() },
};

function methodNotAllowed(method: string) {
  return NextResponse.json({ error: `Method ${method} not allowed` }, { status: 405 });
}

async function dispatch(
  method: string,
  slug: string[] | undefined,
  request: Request
): Promise<NextResponse> {
  const path = (slug ?? []).join('/');

  const routeEntry = ROUTE_TABLE[path];
  if (routeEntry) {
    const handler = routeEntry[method as HttpMethod];
    if (handler) {
      return handler(request);
    }
    return methodNotAllowed(method);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

function withRequestId(request: Request): { request: Request; requestId: string } {
  const requestId = crypto.randomUUID().slice(0, 8);
  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return { request: new Request(request, { headers }), requestId };
}

async function getApiUserTag(request: Request): Promise<string> {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return 'unauthenticated';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    if (!match?.[1]) return 'unauthenticated';
    const session = await decodeSession(decodeURIComponent(match[1]));
    return formatSessionUserTag(session);
  } catch {
    return 'unauthenticated';
  }
}

async function handle(
  method: string,
  slug: string[] | undefined,
  request: Request
): Promise<NextResponse> {
  const basePath = (slug ?? []).join('/') || '/';
  let query = '';
  try {
    const url = new URL(request.url);
    query = url.search;
  } catch {
    // fallback if request.url cannot be parsed as a full URL
  }
  const path = `${basePath}${query}`;
  const { request: childRequest, requestId } = withRequestId(request);
  const start = performance.now();
  const userTag = await getApiUserTag(request);
  console.log(`[api:${requestId}] ${method} ${path} (${userTag}) started`);
  const response = await dispatch(method, slug, childRequest);
  const elapsedMs = (performance.now() - start).toFixed(1);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set('Cache-Control', 'no-store');
  console.log(`[api:${requestId}] -> ${response.status} (${elapsedMs}ms)`);
  return response;
}

export async function GET(request: Request, props: { params: Promise<SlugParams> }) {
  const { slug } = await props.params;
  return handle('GET', slug, request);
}

export async function POST(request: Request, props: { params: Promise<SlugParams> }) {
  const { slug } = await props.params;
  return handle('POST', slug, request);
}

export async function PUT(request: Request, props: { params: Promise<SlugParams> }) {
  const { slug } = await props.params;
  return handle('PUT', slug, request);
}

export async function PATCH(request: Request, props: { params: Promise<SlugParams> }) {
  const { slug } = await props.params;
  return handle('PATCH', slug, request);
}

export async function DELETE(request: Request, props: { params: Promise<SlugParams> }) {
  const { slug } = await props.params;
  return handle('DELETE', slug, request);
}
