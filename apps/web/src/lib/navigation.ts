import { BarChart3, Package, ShoppingCart, MessageSquare, Cpu, Users, Smartphone, Settings, Globe } from 'lucide-react';

export const dashboardNav = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/dashboard/products', label: 'Produk', icon: Package },
  { href: '/dashboard/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/dashboard/chats', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard/ai-config', label: 'AI Config', icon: Cpu },
  { href: '/dashboard/customers', label: 'Pelanggan', icon: Users },
  { href: '/dashboard/wa-session', label: 'WhatsApp', icon: Smartphone },
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
  { href: '/dashboard/web-store', label: 'Web Store', icon: Globe },
] as const;
