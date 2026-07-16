import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { primaryPropertyLocation } from '@/lib/admin-application-map';
import { getStaffUserFromRequest } from '@/lib/admin-request';
import { applicationVisibleToStaff } from '@/lib/staff-auth';

export async function GET(req: NextRequest) {
  const staff = await getStaffUserFromRequest(req);
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const includeArchived = req.nextUrl.searchParams.get('includeArchived') === '1';

    let query = supabase
      .from('investor_applications')
      .select(`
        id, status, loan_program, deal_stage, borrower, entity, loan_request,
        calculations, guideline_warnings, missing_documents, ai_summary,
        additional_notes, submitted_at, created_at, updated_at,
        shape_lead_id, archived, archived_at, assigned_lo,
        investor_properties ( is_main, property_data )
      `)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    const applications = (data || [])
      .map(row => {
        const { investor_properties, ...rest } = row as typeof row & {
          investor_properties?: Array<{ is_main?: boolean; property_data?: { city?: string; state?: string } }>;
        };
        const location = primaryPropertyLocation(investor_properties);
        return {
          ...rest,
          property_city: location.city,
          property_state: location.state,
        };
      })
      .filter(app => applicationVisibleToStaff(app, staff));

    return NextResponse.json({
      applications,
      viewer: {
        email: staff.email,
        role: staff.role,
        canViewAll: staff.role === 'executive' || staff.role === 'admin' || staff.role === 'manager',
      },
    });
  } catch (err) {
    console.error('[admin] list error:', err);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}
