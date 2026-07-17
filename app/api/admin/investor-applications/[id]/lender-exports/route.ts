import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-request';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { resolveDocumentOpenUrl } from '@/lib/investor-document-url';

type RouteContext = { params: Promise<{ id: string }> };

type LenderExportPayload = {
  lender?: string;
  generatedAt?: string;
  includeReo?: boolean;
  files?: Array<{ name?: string; storageRef?: string }>;
  checklist?: Array<{
    key?: string;
    label?: string;
    required?: boolean;
    uploaded?: boolean;
    matchedDocumentName?: string;
  }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('investor_application_events')
      .select('payload, created_at')
      .eq('application_id', id)
      .eq('event_type', 'lender_exports_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data?.payload) {
      return NextResponse.json({ exports: null });
    }

    const payload = data.payload as LenderExportPayload;
    const files = await Promise.all(
      (payload.files || []).map(async f => {
        const openUrl = await resolveDocumentOpenUrl(f.storageRef || null);
        if (!openUrl) return null;
        return {
          name: f.name || 'lender-export.csv',
          openUrl,
        };
      }),
    );

    return NextResponse.json({
      exports: {
        lender: payload.lender || 'park_place',
        generatedAt: payload.generatedAt || data.created_at,
        includeReo: Boolean(payload.includeReo),
        files: files.filter((f): f is NonNullable<typeof f> => f != null),
        checklist: payload.checklist || [],
      },
    });
  } catch (err) {
    console.error('[admin] lender exports error:', err);
    return NextResponse.json({ error: 'Failed to load lender exports' }, { status: 500 });
  }
}

