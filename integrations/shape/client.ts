// TODO: Replace stub with real Shape CRM API calls
// Docs: https://developer.setshape.com/

export interface ShapeLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanProgram: string;
  loanAmount?: string;
  status: string;
  source: string;
  note?: string;
}

export async function upsertShapeLead(
  payload: ShapeLeadPayload
): Promise<{ id?: string; success: boolean; error?: string }> {
  if (process.env.ENABLE_SHAPE_SYNC !== 'true') {
    console.log('[Shape stub] Would upsert lead:', payload);
    return { success: true, id: 'stub-' + Date.now() };
  }

  // TODO: implement real Shape API call
  // const base = process.env.SHAPE_API_BASE_URL;
  // const key = process.env.SHAPE_API_KEY;
  // const res = await fetch(`${base}/leads`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify(mapped),
  // });
  console.log('[Shape] ENABLE_SHAPE_SYNC=true but integration not yet implemented. Payload:', payload);
  return { success: false, error: 'Shape integration pending configuration' };
}
