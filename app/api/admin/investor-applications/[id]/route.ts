import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/admin-request';
import { applicationToInvestorShapeApp } from '@/lib/admin-application-map';
import type { InvestorApplication } from '@/types/investor-application';
import {
  assignShapeLeadOwner,
  createShapeLeadForApplication,
  markShapeLeadRemoved,
  syncShapeLeadForApplication,
} from '@/integrations/shape/ops-actions';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json() as { archived?: boolean };

  if (typeof body.archived !== 'boolean') {
    return NextResponse.json({ error: 'archived (boolean) required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('investor_applications')
      .update({
        archived: body.archived,
        archived_at: body.archived ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select('id, archived, archived_at')
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ application: data });
  } catch (err) {
    console.error('[admin] archive error:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json() as {
    action?: 'create' | 'sync' | 'delete' | 'assign';
    depursLo?: number;
  };

  if (!body.action) {
    return NextResponse.json({ error: 'action required' }, { status: 400 });
  }

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

    const app = applicationToInvestorShapeApp(row) as unknown as InvestorApplication;
    const aiSummary = (row.ai_summary as string) || '';

    if (body.action === 'create' || body.action === 'sync') {
      const result = body.action === 'sync'
        ? await syncShapeLeadForApplication(app, id, aiSummary)
        : await createShapeLeadForApplication(app, id, aiSummary);

      if (!result.success || !result.id) {
        return NextResponse.json(
          { error: result.error || 'Shape create failed' },
          { status: 502 },
        );
      }

      await supabase
        .from('investor_applications')
        .update({ shape_lead_id: result.id })
        .eq('id', id);

      return NextResponse.json({
        ok: true,
        shapeLeadId: result.id,
        action: body.action,
      });
    }

    const shapeLeadId = (row.shape_lead_id as string | null)?.trim();
    if (!shapeLeadId) {
      return NextResponse.json({ error: 'No Shape lead linked to this application' }, { status: 400 });
    }

    if (body.action === 'assign') {
      const depursLo = Number(body.depursLo);
      if (!Number.isFinite(depursLo) || depursLo <= 0) {
        return NextResponse.json({ error: 'depursLo required for assign' }, { status: 400 });
      }

      const result = await assignShapeLeadOwner(shapeLeadId, depursLo);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Assign failed' }, { status: 502 });
      }

      return NextResponse.json({
        ok: true,
        shapeLeadId,
        assignedTo: result.assignedTo,
      });
    }

    if (body.action === 'delete') {
      const result = await markShapeLeadRemoved(shapeLeadId);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Shape remove failed' }, { status: 502 });
      }

      await supabase
        .from('investor_applications')
        .update({ shape_lead_id: null })
        .eq('id', id);

      return NextResponse.json({
        ok: true,
        shapeLeadId,
        removed: true,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin] shape action error:', err);
    return NextResponse.json({ error: 'Shape action failed' }, { status: 500 });
  }
}
