import { apiFetch } from '@/lib/api/client';
import type { Invoice, Payment } from '@/lib/api/types';

export type PaymentVerificationResult = {
  id?: string | number;
  status?: string;
  message?: string;
  testMode?: boolean;
  paymentMode?: string;
  settlementStatus?: string;
  amountSettled?: number;
  fee?: number;
};

export async function getStudentInvoices(): Promise<Invoice[]> {
  return apiFetch('/students/me/invoices');
}

export async function getStudentPayments(): Promise<Payment[]> {
  return apiFetch('/students/me/payments');
}

export async function payInvoice(invoiceId: string | number): Promise<Record<string, unknown>> {
  return apiFetch(`/students/me/invoices/${invoiceId}/pay`, { method: 'POST' });
}

export async function verifyInvoicePayment(invoiceId: string | number): Promise<PaymentVerificationResult> {
  return apiFetch(`/students/me/invoices/${invoiceId}/verify`, { method: 'POST' });
}
