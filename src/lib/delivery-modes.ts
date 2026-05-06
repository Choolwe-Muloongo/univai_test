export const deliveryModes = [
  { value: 'software_only', label: 'Software-only', description: 'Fully digital access, virtual labs, online exams where available.' },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of online content, live sessions, and scheduled campus activities.' },
  { value: 'physical', label: 'Physical learning', description: 'Campus-first delivery with physical labs, venues, and in-person exams.' },
] as const;

export type DeliveryMode = (typeof deliveryModes)[number]['value'];

export function deliveryModeLabel(mode?: string | null) {
  return deliveryModes.find((item) => item.value === mode)?.label ?? 'Hybrid';
}
