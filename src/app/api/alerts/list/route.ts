import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/alerts-store';

export async function GET() {
  try {
    const data = getAlerts(200);
    return NextResponse.json({ alerts: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to read alerts.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
