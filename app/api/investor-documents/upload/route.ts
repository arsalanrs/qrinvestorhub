import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const BUCKET = 'investor-documents';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentId = formData.get('documentId') as string;
    const applicationId = formData.get('applicationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Ensure bucket exists (graceful fallback)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET);
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      if (bucketError) {
        console.error('[upload] bucket creation error:', bucketError);
      }
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${applicationId || 'anonymous'}/${documentId}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('[upload] storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

    return NextResponse.json({
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      path: data.path,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
