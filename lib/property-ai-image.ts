import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PropertyData } from '@/types/investor-application';

export const PROPERTY_IMAGES_BUCKET = 'investor-property-images';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: 'single-family home',
  two_to_four_unit: 'duplex or small multi-family building',
  multifamily_5plus: 'apartment building',
  condo: 'condominium',
  townhome: 'townhome',
  mixed_use: 'mixed-use building',
  commercial: 'commercial property',
  land: 'vacant land parcel',
  other: 'residential investment property',
};

function buildPropertyImagePrompt(property: PropertyData): string {
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType || ''] || 'residential investment property';
  const location = [property.city, property.state].filter(Boolean).join(', ') || 'suburban United States';
  const beds = property.bedrooms ? `${property.bedrooms} bedrooms` : '';
  const styleHint = property.occupancyStatus === 'tenant_occupied'
    ? 'well-maintained rental property'
    : 'attractive investment property';

  return [
    `Professional real estate marketing photograph of a ${typeLabel}, ${styleHint}, located in ${location}.`,
    beds ? `${beds}.` : '',
    'Golden hour lighting, manicured landscaping, strong curb appeal, photorealistic architectural photography.',
    'No people, no text, no logos, no watermarks.',
  ].filter(Boolean).join(' ');
}

async function ensurePublicBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some(b => b.name === PROPERTY_IMAGES_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(PROPERTY_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });
  if (error && !error.message.includes('already exists')) {
    console.error('[property-ai-image] bucket error:', error.message);
  }
}

export async function getPropertyHeroPublicUrl(
  supabase: SupabaseClient,
  aiHeroPath: string | null | undefined,
): Promise<string | null> {
  if (!aiHeroPath) return null;
  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(aiHeroPath);
  return data.publicUrl || null;
}

export async function generatePropertyHeroImage(
  supabase: SupabaseClient,
  propertyRowId: string,
  applicationId: string,
  property: PropertyData,
  existingPath?: string | null,
): Promise<string | null> {
  if (existingPath) {
    return getPropertyHeroPublicUrl(supabase, existingPath);
  }

  if (process.env.ENABLE_PROPERTY_AI_IMAGES !== 'true') {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: buildPropertyImagePrompt(property),
      n: 1,
      size: '1792x1024',
      response_format: 'b64_json',
      quality: 'standard',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;

    await ensurePublicBucket(supabase);

    const buffer = Buffer.from(b64, 'base64');
    const path = `${applicationId}/${propertyRowId}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('[property-ai-image] upload error:', uploadError.message);
      return null;
    }

    const { error: updateError } = await supabase
      .from('investor_properties')
      .update({
        ai_hero_path: path,
        ai_hero_generated_at: new Date().toISOString(),
      })
      .eq('id', propertyRowId);

    if (updateError) {
      console.error('[property-ai-image] db update error:', updateError.message);
    }

    return getPropertyHeroPublicUrl(supabase, path);
  } catch (err) {
    console.error('[property-ai-image] generation error:', err);
    return null;
  }
}
