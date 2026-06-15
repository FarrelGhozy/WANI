import axios from 'axios';
import { ApiResponse } from '../types/index.js';

export function success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, meta };
}

export function error(message: string, statusCode = 400): { error: string; statusCode: number } {
  return { error: message, statusCode };
}

export function formatPhone(phone: string): string {
  // Remove non-digit chars, ensure starts with 62
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return '62' + digits;
}

export function formatCurrency(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Download a URL and return its content as a Buffer.
 * Used by media sender helpers.
 */
export async function downloadAndBuffer(url: string): Promise<Buffer> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30_000,
  });
  return Buffer.from(response.data);
}
