import { NextResponse } from 'next/server';

export async function GET_health(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'rachadoshorriveisco',
    timestamp: new Date().toISOString(),
  });
}
