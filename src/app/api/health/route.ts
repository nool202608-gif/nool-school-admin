import { NextResponse } from 'next/server';

// Process health only - no dependency check (no server-side database/auth
// call happens here), matching nool-core's own /health vs /ready split.
// Used by the Docker HEALTHCHECK.
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
