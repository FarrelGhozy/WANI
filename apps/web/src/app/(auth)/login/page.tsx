'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  phone: z.string().min(10, 'Nomor WA minimal 10 digit').max(15, 'Nomor WA maksimal 15 digit').regex(/^62\d+/, 'Nomor WA harus diawali 62'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ phone: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginForm;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setServerError(data.error || 'Gagal masuk');
        return;
      }
      router.push('/dashboard');
    } catch {
      setServerError('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: keyof LoginForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <Store className="mx-auto h-12 w-12 text-primary-600" />
        <h1 className="mt-3 text-2xl font-bold text-surface-900">Masuk ke WANI</h1>
        <p className="mt-1 text-sm text-surface-500">Masuk untuk kelola toko Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-surface-700">
            Nomor WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="6281234567890"
            value={form.phone}
            onChange={e => updateField('phone', e.target.value)}
            className={cn(
              'mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-colors',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
              errors.phone ? 'border-red-400' : 'border-surface-300',
            )}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-surface-700">
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={e => updateField('password', e.target.value)}
            className={cn(
              'mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-colors',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
              errors.password ? 'border-red-400' : 'border-surface-300',
            )}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors',
            'bg-primary-600 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Masuk'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
          Daftar
        </Link>
      </p>
    </div>
  );
}
