import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function parseSupabaseStorageRef(
  fileUrl: string,
): { bucket: string; path: string } | null {
  if (!fileUrl.startsWith('supabase://')) return null;
  const rest = fileUrl.slice('supabase://'.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;
  return {
    bucket: rest.slice(0, slash),
    path: rest.slice(slash + 1),
  };
}

export async function resolveDocumentOpenUrl(fileUrl: string | null): Promise<string | null> {
  if (!fileUrl?.trim()) return null;

  const ref = parseSupabaseStorageRef(fileUrl);
  if (!ref) {
    return fileUrl.startsWith('http') ? fileUrl : null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('[documents] signed URL error:', error?.message);
    return null;
  }

  return data.signedUrl;
}

export type InvestorDocumentRow = {
  id: string;
  document_type: string | null;
  file_name: string | null;
  file_url: string | null;
  status: string | null;
  created_at: string;
};

export async function listUploadedDocumentsWithUrls(
  applicationId: string,
): Promise<Array<{
  id: string;
  label: string;
  documentType: string | null;
  fileName: string | null;
  uploadedAt: string;
  openUrl: string;
}>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('investor_documents')
    .select('id, document_type, file_name, file_url, status, created_at')
    .eq('application_id', applicationId)
    .eq('status', 'uploaded')
    .not('file_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data || []) as InvestorDocumentRow[];
  const results = await Promise.all(
    rows.map(async row => {
      const openUrl = await resolveDocumentOpenUrl(row.file_url);
      if (!openUrl) return null;
      return {
        id: row.id,
        label: row.file_name || row.document_type || 'Document',
        documentType: row.document_type,
        fileName: row.file_name,
        uploadedAt: row.created_at,
        openUrl,
      };
    }),
  );

  return results.filter((row): row is NonNullable<typeof row> => row != null);
}
