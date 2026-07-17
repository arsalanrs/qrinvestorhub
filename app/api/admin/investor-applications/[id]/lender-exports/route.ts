import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-request';
import { applicationToInvestorShapeApp } from '@/lib/admin-application-map';
import { generateParkPlaceLenderExports } from '@/lib/lender-exports/park-place';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { resolveDocumentOpenUrl } from '@/lib/investor-document-url';
import type { InvestorApplication } from '@/types/investor-application';

type RouteContext = { params: Promise<{ id: string }> };

type LenderExportPayload = {
  lender?: string;
  generatedAt?: string;
  includeReo?: boolean;
  files?: Array<{ name?: string; storageRef?: string }>;
  preview?: {
    project?: Record<string, string | number | boolean>;
    budget?: Record<string, string | number | boolean>;
    reo?: Record<string, string | number | boolean>;
  };
  checklist?: Array<{
    key?: string;
    label?: string;
    required?: boolean;
    uploaded?: boolean;
    matchedDocumentName?: string;
  }>;
};

async function hydrateExports(payload: LenderExportPayload, fallbackGeneratedAt: string) {
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

  return {
    lender: payload.lender || 'park_place',
    generatedAt: payload.generatedAt || fallbackGeneratedAt,
    includeReo: Boolean(payload.includeReo),
    files: files.filter((f): f is NonNullable<typeof f> => f != null),
    preview: payload.preview || null,
    checklist: payload.checklist || [],
  };
}

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
    return NextResponse.json({ exports: await hydrateExports(payload, data.created_at) });
  } catch (err) {
    console.error('[admin] lender exports error:', err);
    return NextResponse.json({ error: 'Failed to load lender exports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const supabase = createSupabaseAdminClient();
    const { data: row, error: rowError } = await supabase
      .from('investor_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (row.loan_program !== 'construction') {
      return NextResponse.json({ error: 'Lender package is available for construction applications only' }, { status: 400 });
    }

    const app = applicationToInvestorShapeApp(row) as unknown as InvestorApplication;
    const lenderExport = await generateParkPlaceLenderExports(id, app);

    await supabase.from('investor_application_events').insert({
      application_id: id,
      event_type: 'lender_exports_generated',
      payload: lenderExport,
    });

    return NextResponse.json({
      ok: true,
      exports: await hydrateExports(lenderExport, lenderExport.generatedAt || new Date().toISOString()),
    });
  } catch (err) {
    console.error('[admin] lender exports regenerate error:', err);
    return NextResponse.json({ error: 'Failed to regenerate lender package' }, { status: 500 });
  }
}

