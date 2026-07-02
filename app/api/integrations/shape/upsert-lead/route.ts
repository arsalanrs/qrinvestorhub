import { NextRequest, NextResponse } from 'next/server';
import { upsertShapeLead } from '@/integrations/shape/client';
import type { ShapeLeadPayload } from '@/integrations/shape/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ShapeLeadPayload;
    const result = await upsertShapeLead(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[shape upsert-lead]', err);
    return NextResponse.json({ success: false, error: 'Failed to upsert Shape lead' }, { status: 500 });
  }
}
