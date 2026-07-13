import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { normalizePhoneDigits } from '@/integrations/shape/phone';

export type CallTranscriptContext = {
  found: boolean;
  summary: string;
  statusLabel?: string;
  callDate?: string;
  shapeLeadId?: string;
};

function formatQuestRockAnalysis(fields: Record<string, unknown> | null | undefined): string {
  if (!fields) return '';
  const qa = fields.questrock_analysis;
  if (typeof qa === 'string' && qa.trim()) return qa.trim();
  if (qa && typeof qa === 'object') {
    return Object.entries(qa as Record<string, unknown>)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v).trim()}`)
      .join('\n');
  }
  const sidebar = fields.notes_sidebar ?? fields.notes_sidebar_ai_note;
  if (typeof sidebar === 'string' && sidebar.trim()) return sidebar.trim();
  const callSummary = fields.call_summary;
  if (typeof callSummary === 'string' && callSummary.trim()) return callSummary.trim();
  return '';
}

/**
 * Optional: pull latest inbound call summary from Call Tracker Supabase by borrower phone.
 * Set INBOUND_SUPABASE_URL + INBOUND_SUPABASE_SERVICE_ROLE_KEY on Investor Hub Vercel.
 */
export async function lookupCallTranscriptSummary(phone: string): Promise<CallTranscriptContext> {
  const url = process.env.INBOUND_SUPABASE_URL?.trim();
  const key = process.env.INBOUND_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return { found: false, summary: '' };
  }

  const phone10 = normalizePhoneDigits(phone);
  if (phone10.length !== 10) {
    return { found: false, summary: '' };
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const phonePattern = `%${phone10}%`;
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('lead_id, shape_lead_id, full_name, phone_number')
      .or(`phone_number.eq.${phone10},phone_number.ilike.${phonePattern}`)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (leadError || !leads?.length) {
      return { found: false, summary: '' };
    }

    const lead = leads[0];
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('transcript_text, fields_populated, ai_status_label, timestamp')
      .eq('lead_id', lead.lead_id)
      .not('transcript_text', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!transcript) {
      return {
        found: false,
        summary: '',
        shapeLeadId: lead.shape_lead_id ? String(lead.shape_lead_id) : undefined,
      };
    }

    const fields = (transcript.fields_populated ?? {}) as Record<string, unknown>;
    const analysis = formatQuestRockAnalysis(fields);
    const text = analysis || String(transcript.transcript_text ?? '').trim().slice(0, 2500);

    if (!text) {
      return { found: false, summary: '', shapeLeadId: lead.shape_lead_id ? String(lead.shape_lead_id) : undefined };
    }

    return {
      found: true,
      summary: text,
      statusLabel: transcript.ai_status_label ? String(transcript.ai_status_label) : undefined,
      callDate: transcript.timestamp ? String(transcript.timestamp) : undefined,
      shapeLeadId: lead.shape_lead_id ? String(lead.shape_lead_id) : undefined,
    };
  } catch (err) {
    console.error('[call-transcript-lookup]', err);
    return { found: false, summary: '' };
  }
}
