import 'server-only';
import { NextResponse } from 'next/server';
import { getShapeLoRoster } from '@/integrations/shape/lo-roster';

export async function GET() {
  return NextResponse.json({
    roster: getShapeLoRoster().map(entry => ({
      name: entry.name,
      depursLo: entry.depursLo,
      email: entry.email || null,
    })),
  });
}
