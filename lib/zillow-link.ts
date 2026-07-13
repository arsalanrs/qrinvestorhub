export function buildZillowSearchUrl(parts: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string | null {
  const line = [parts.address, parts.city, parts.state, parts.zip].filter(Boolean).join(', ');
  if (!line.trim()) return null;
  return `https://www.zillow.com/homes/${encodeURIComponent(line.replace(/\s+/g, '-'))}_rb/`;
}
