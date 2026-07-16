import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-request';
import { listUploadedDocumentsWithUrls } from '@/lib/investor-document-url';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const documents = await listUploadedDocumentsWithUrls(id);
    return NextResponse.json({ documents });
  } catch (err) {
    console.error('[admin] documents error:', err);
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
  }
}
