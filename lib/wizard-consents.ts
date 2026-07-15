export const INVESTOR_CONSENTS = [
  { name: 'accuracyConfirmed' as const, label: 'I confirm that all information provided is accurate and complete to the best of my knowledge.' },
  { name: 'investmentPurpose' as const, label: 'I confirm this loan is for investment purposes only (non-owner-occupied property).' },
  { name: 'noOwnerOccupancy' as const, label: 'I understand that owner-occupancy of the subject property is not permitted under this loan program.' },
  { name: 'contactConsent' as const, label: 'I consent to being contacted by QuestRock or its lending partners via phone, email, or SMS regarding this application.' },
  { name: 'electronicComms' as const, label: 'I agree to receive electronic communications and disclosures related to this loan application.' },
  { name: 'creditPullConsent' as const, label: 'I agree to have my credit pulled as part of this loan application.' },
];

export const COMMERCIAL_RE_CONSENTS = [
  { name: 'accuracyConfirmed' as const, label: 'I confirm that all information provided is accurate and complete to the best of my knowledge.' },
  { name: 'contactConsent' as const, label: 'I consent to being contacted by QuestRock or its lending partners via phone, email, or SMS regarding this application.' },
  { name: 'electronicComms' as const, label: 'I agree to receive electronic communications and disclosures related to this loan application.' },
  { name: 'creditPullConsent' as const, label: 'I agree to have my credit pulled as part of this loan application.' },
];

export function allRequiredConsentsChecked(
  consents: Record<string, boolean> | undefined,
  program: string,
): boolean {
  const list = program === 'commercial_re' ? COMMERCIAL_RE_CONSENTS : INVESTOR_CONSENTS;
  return Boolean(consents && list.every(c => consents[c.name]));
}
