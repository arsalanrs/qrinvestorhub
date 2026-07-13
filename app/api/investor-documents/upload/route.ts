import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabase/server';

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

    const supabase = createSupabaseApiClient();

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET);
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (bucketError) {
        console.error('[upload] bucket creation error:', bucketError);
      }
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${applicationId || 'draft'}/${documentId}-${Date.now()}.${ext}`;

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

    // Private bucket — store storage path; staff retrieve via Supabase signed URLs / ops portal
    const storageRef = `supabase://${BUCKET}/${data.path}`;

    return NextResponse.json({
      fileUrl: storageRef,
      fileName: file.name,
      path: data.path,
      bucket: BUCKET,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
