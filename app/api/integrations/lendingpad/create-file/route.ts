import { NextRequest, NextResponse } from 'next/server';
import { mapApplicationToLendingPad } from '@/integrations/lendingpad/map-application';
import type { InvestorApplication } from '@/types/investor-application';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const payload = mapApplicationToLendingPad(body);

    if (process.env.ENABLE_LENDINGPAD_SYNC !== 'true') {
      console.log('[LendingPad stub] Would create file with payload:', payload);
      return NextResponse.json({ success: true, fileId: 'stub-lp-' + Date.now() });
    }

    // TODO: implement real LendingPad API call
    // const base = process.env.LENDINGPAD_API_BASE_URL;
    // const key = process.env.LENDINGPAD_API_KEY;
    console.log('[LendingPad] Integration not yet implemented. Payload:', payload);
    return NextResponse.json({ success: false, error: 'LendingPad integration pending configuration' });
  } catch (err) {
    console.error('[lendingpad create-file]', err);
    return NextResponse.json({ success: false, error: 'Failed to create LendingPad file' }, { status: 500 });
  }
}
