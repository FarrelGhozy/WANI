'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMerchant } from '@/lib/auth-context';
import { dashboardNav } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { merchant, isLoading } = useMerchant();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const segments = pathname.split('/').filter(Boolean);

  const currentLabel = dashboardNav.find(
    (item) =>
      item.href === pathname ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href)),
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-1 text-sm text-surface-400">
          <span>Dashboard</span>
          {currentLabel && currentLabel.href !== '/dashboard' && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-surface-700">{currentLabel.label}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
        {!isLoading && merchant && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-surface-600 sm:block">
              {merchant.businessName}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {merchant.businessName.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
