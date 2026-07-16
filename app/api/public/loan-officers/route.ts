import { NextResponse } from 'next/server';
import { getPublicLoRoster } from '@/lib/loan-officer-links';

export async function GET() {
  return NextResponse.json({ loanOfficers: getPublicLoRoster() });
}
