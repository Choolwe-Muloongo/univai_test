import type { Invoice } from '@/lib/api/types';
import type { ShortCourseEnrollmentSummary, ShortCourseProgress } from '@/lib/api/short-courses';

const PLAN_LABELS: Record<string, string> = {
  free_access: 'Free Access',
  starter_access: 'Starter Access',
  entry: 'Starter Access',
  monthly_access: 'Monthly Access',
  access_only: 'Monthly Access',
  access_ai: 'AI Plus',
  ai_lite: 'AI Lite',
  ai_plus: 'AI Plus',
  ai_scholar: 'AI Scholar',
  certified_premium: 'Certified Premium',
  premium_certificate: 'Certified Premium',
  certified_elite: 'Certified Elite',
  elite_certificate: 'Certified Elite',
};

const ACCESS_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Pending payment',
  pending_payment: 'Pending payment',
  certificate_paid: 'Certificate paid',
  lessons_completed: 'Lessons completed',
  exam_failed: 'Exam not passed',
  completed: 'Completed',
  expired: 'Expired',
};

export function planLabel(plan?: string | null) {
  if (!plan) return 'Not active';
  return PLAN_LABELS[plan] ?? plan.replace(/_/g, ' ');
}

export function accessLabel(progress?: Pick<ShortCourseProgress, 'status' | 'entryFeePaid'> | Pick<ShortCourseEnrollmentSummary, 'status' | 'entryFeePaid'> | null) {
  if (!progress) return 'Not active';
  const status = String(progress.status ?? '').trim().toLowerCase();
  if (status === 'active' && progress.entryFeePaid) return ACCESS_LABELS.active;
  if (status === 'completed') return ACCESS_LABELS.completed;
  if (status === 'lessons_completed') return ACCESS_LABELS.lessons_completed;
  if (status === 'certificate_paid') return ACCESS_LABELS.certificate_paid;
  if (status === 'exam_failed') return ACCESS_LABELS.exam_failed;
  if (!progress.entryFeePaid) return ACCESS_LABELS.pending_payment;
  return ACCESS_LABELS[status] ?? 'Active';
}

export function daysRemaining(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function timeRemainingLabel(value?: string | null) {
  const remainingDays = daysRemaining(value);
  if (remainingDays == null) return 'No expiry set';
  if (remainingDays < 0) return 'Expired';
  if (remainingDays === 0) return 'Expires today';
  if (remainingDays === 1) return '1 day left';
  return `${remainingDays} days left`;
}

export function isExpiringSoon(value?: string | null, thresholdDays = 5) {
  const remainingDays = daysRemaining(value);
  return remainingDays != null && remainingDays >= 0 && remainingDays <= thresholdDays;
}

export function formatExpiryDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function invoiceCategory(invoice: Invoice) {
  const title = `${invoice.title} ${invoice.type ?? ''}`.toLowerCase();
  if (title.includes('bundle')) return 'Bundle';
  if (title.includes('certificate')) return 'Certificate';
  if (title.includes('access') || title.includes('short course')) return 'Course access';
  return 'Invoice';
}

export function invoiceFriendlyStatus(status: string) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'completed') return 'Paid';
  if (normalized === 'pending' || normalized === 'unpaid') return 'Pending';
  if (normalized === 'failed') return 'Failed';
  return normalized ? normalized.replace(/_/g, ' ') : 'Unknown';
}
