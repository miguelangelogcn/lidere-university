// This file is a duplicate and should not be used.
// The correct file is located at src/app/api/webhook/route.ts.
// This is being kept to prevent build errors from misconfiguration.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    return NextResponse.json({ error: 'This webhook endpoint is disabled. The correct one is inside the /src directory.' }, { status: 404 });
}
