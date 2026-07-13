import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  borrowerMatchesPortalEmail,
  getPortalSessionEmail,
} from '@/lib/portal-auth';
import {
  generatePropertyHeroImage,
  getPropertyHeroPublicUrl,
} from '@/lib/property-ai-image';
import type { PropertyData } from '@/types/investor-application';

export async function GET(req: NextRequest) {
  const portalEmail = await getPortalSessionEmail();
  if (!portalEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId')?.trim();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: row, error: rowError } = await supabase
      .from('investor_properties')
      .select('id, application_id, property_data, ai_hero_path, ai_hero_generated_at')
      .eq('id', propertyId)
      .single();

    if (rowError || !row) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { data: application, error: appError } = await supabase
      .from('investor_applications')
      .select('borrower')
      .eq('id', row.application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!borrowerMatchesPortalEmail(application.borrower, portalEmail)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const property = row.property_data as PropertyData;
    let url = await getPropertyHeroPublicUrl(supabase, row.ai_hero_path);

    if (!url) {
      url = await generatePropertyHeroImage(
        supabase,
        row.id,
        row.application_id,
        property,
        row.ai_hero_path,
      );
    }

    return NextResponse.json({
      propertyId: row.id,
      url,
      generated: Boolean(url && !row.ai_hero_generated_at),
      cached: Boolean(row.ai_hero_path),
    });
  } catch (err) {
    console.error('[portal/property-images]', err);
    return NextResponse.json({ error: 'Could not load property image' }, { status: 500 });
  }
}
