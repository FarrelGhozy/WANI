'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { dashboardNav } from '@/lib/navigation';
import { useMerchant } from '@/lib/auth-context';
import {
  Store,
  LogOut,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { merchant, isLoading } = useMerchant();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-surface-200 transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <Store className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-surface-900">WANI</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {dashboardNav.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-200 p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
              <div className="text-sm text-surface-400">Memuat...</div>
            </div>
          ) : merchant ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {merchant.businessName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-900">
                  {merchant.businessName}
                </p>
                <p className="truncate text-xs text-surface-400">{merchant.phone}</p>
              </div>
            </div>
          ) : null}
          <Link
            href="/login"
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' });
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Link>
        </div>
      </aside>
    </>
  );
}
