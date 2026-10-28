import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
};

export async function GET_auth_me(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      user: session,
    },
    {
      headers: NO_CACHE_HEADERS,
    }
  );
}
