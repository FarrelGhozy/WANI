import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Toko Online',
  description: 'Belanja mudah lewat WhatsApp',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
