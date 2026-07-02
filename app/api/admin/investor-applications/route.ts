import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { isAdminConfigured, verifyAdminCredentials } from '@/lib/admin-auth';

function verifyAdminRequest(req: NextRequest): boolean {
  const email = req.headers.get('x-admin-email');
  const password = req.headers.get('x-admin-password');
  return verifyAdminCredentials(email, password);
}

export async function GET(req: NextRequest) {
  if (!verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('investor_applications')
      .select('id, status, loan_program, deal_stage, borrower, entity, loan_request, calculations, guideline_warnings, missing_documents, ai_summary, additional_notes, submitted_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: data || [] });
  } catch (err) {
    console.error('[admin] list error:', err);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 });
    }

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
