import { COMMERCIAL_PROPERTY_TYPES } from '@/config/commercial-re-options';
import type { CommercialPropertyType } from '@/types/commercial-re';

export function commercialPropertyTypeLabel(value: CommercialPropertyType | string): string {
  if (!value) return '';
  return COMMERCIAL_PROPERTY_TYPES.find(t => t.value === value)?.label || value.replace(/_/g, ' ');
}
