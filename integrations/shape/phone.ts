/** Normalize US phone to 10 digits for Shape search. */
export function normalizePhoneDigits(phone: string): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
