'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Store,
  Save,
  CreditCard,
  Clock,
  Truck,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useMerchant } from '@/lib/auth-context';
import { formatRupiah } from '@/lib/format';

interface Settings {
  currency?: string;
  timezone?: string;
  min_order?: number;
  free_delivery_km?: number;
  delivery_fee_city?: number;
  delivery_fee_outside?: number;
  estimated_delivery?: string;
  delivery_area?: string;
  business_hours?: string;
  payment_methods?: string[];
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  qris_image?: string;
  qris_holder?: string;
}

const hoursDefault = [
  { day: 'Senin', open: '08:00', close: '21:00', active: true },
  { day: 'Selasa', open: '08:00', close: '21:00', active: true },
  { day: 'Rabu', open: '08:00', close: '21:00', active: true },
  { day: 'Kamis', open: '08:00', close: '21:00', active: true },
  { day: 'Jumat', open: '08:00', close: '21:00', active: true },
  { day: 'Sabtu', open: '08:00', close: '18:00', active: true },
  { day: 'Minggu', open: '--:--', close: '--:--', active: false },
];

export default function SettingsPage() {
  const { merchant, isLoading: authLoading } = useMerchant();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<string[]>(['cash']);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [qrisImage, setQrisImage] = useState('');
  const [qrisHolder, setQrisHolder] = useState('');

  const [businessHours, setBusinessHours] = useState(hoursDefault);

  const [minOrder, setMinOrder] = useState(0);
  const [deliveryFeeCity, setDeliveryFeeCity] = useState(5000);
  const [deliveryFeeOutside, setDeliveryFeeOutside] = useState(15000);
  const [estimatedDelivery, setEstimatedDelivery] = useState('30-60 menit');
  const [deliveryArea, setDeliveryArea] = useState('city');

  const fetchSettings = useCallback(async () => {
    if (!merchant) return;
    setBusinessName(merchant.businessName);
    setAddress(merchant.address || '');
    const res = await api.get<{ data: Settings }>('/settings');
    if (res.success && res.data.data) {
      const s = res.data.data;
      if (s.min_order) setMinOrder(s.min_order);
      if (s.delivery_fee_city) setDeliveryFeeCity(s.delivery_fee_city);
      if (s.delivery_fee_outside) setDeliveryFeeOutside(s.delivery_fee_outside);
      if (s.estimated_delivery) setEstimatedDelivery(s.estimated_delivery);
      if (s.delivery_area) setDeliveryArea(s.delivery_area);
      if (s.payment_methods) setPaymentMethods(s.payment_methods);
      if (s.bank_name) setBankName(s.bank_name);
      if (s.bank_account) setBankAccount(s.bank_account);
      if (s.bank_holder) setBankHolder(s.bank_holder);
      if (s.qris_image) setQrisImage(s.qris_image);
      if (s.qris_holder) setQrisHolder(s.qris_holder);
      if (s.business_hours) {
        try { setBusinessHours(JSON.parse(s.business_hours as string)); } catch {}
      }
    }
    setLoading(false);
  }, [merchant]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function saveProfile() {
    setSaving('profile');
    setError('');
    setSuccess('');
    const res = await api.put('/merchants/me', { businessName, address: address || undefined });
    setSaving('');
    if (res.success) showSuccess('Profil berhasil disimpan');
    else setError(res.error || 'Gagal');
  }

  async function savePayment() {
    setSaving('payment');
    setError('');
    setSuccess('');
    const res = await api.put('/settings', {
      payment_methods: paymentMethods,
      bank_name: bankName,
      bank_account: bankAccount,
      bank_holder: bankHolder,
      qris_image: qrisImage,
      qris_holder: qrisHolder,
    });
    setSaving('');
    if (res.success) showSuccess('Pembayaran berhasil disimpan');
    else setError(res.error || 'Gagal');
  }

  async function saveHours() {
    setSaving('hours');
    setError('');
    setSuccess('');
    const res = await api.put('/settings', {
      business_hours: JSON.stringify(businessHours),
    });
    setSaving('');
    if (res.success) showSuccess('Jam operasional berhasil disimpan');
    else setError(res.error || 'Gagal');
  }

  async function saveDelivery() {
    setSaving('delivery');
    setError('');
    setSuccess('');
    const res = await api.put('/settings', {
      min_order: minOrder,
      delivery_fee_city: deliveryFeeCity,
      delivery_fee_outside: deliveryFeeOutside,
      estimated_delivery: estimatedDelivery,
      delivery_area: deliveryArea,
    });
    setSaving('');
    if (res.success) showSuccess('Pengiriman berhasil disimpan');
    else setError(res.error || 'Gagal');
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  function togglePayment(method: string) {
    setPaymentMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method],
    );
  }

  if (authLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full"/><Skeleton className="h-48 w-full"/></div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Pengaturan</h1>

      <div className="space-y-6 max-w-2xl">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Profil Toko</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Nama Toko" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <Input label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Merdeka No. 123" />
            <Input label="No. WhatsApp" value={merchant?.phone || ''} disabled />
            <Button onClick={saveProfile} loading={saving === 'profile'}><Save className="h-4 w-4" />Simpan Profil</Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Metode Pembayaran</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Switch checked={paymentMethods.includes('cash')} onChange={() => togglePayment('cash')} label="Tunai (Cash)" /></div>
            <div className="flex items-center gap-3"><Switch checked={paymentMethods.includes('transfer')} onChange={() => togglePayment('transfer')} label="Transfer Bank" /></div>
            {paymentMethods.includes('transfer') && (
              <div className="ml-8 space-y-3 border-l-2 border-surface-200 pl-4">
                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500">
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="BSI">BSI</option>
                </select>
                <Input label="No. Rekening" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                <Input label="Atas Nama" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-3"><Switch checked={paymentMethods.includes('qris')} onChange={() => togglePayment('qris')} label="QRIS" /></div>
            {paymentMethods.includes('qris') && (
              <div className="ml-8 space-y-3 border-l-2 border-surface-200 pl-4">
                <Input label="Atas Nama" value={qrisHolder} onChange={(e) => setQrisHolder(e.target.value)} />
              </div>
            )}
            <Button onClick={savePayment} loading={saving === 'payment'}><Save className="h-4 w-4" />Simpan Pembayaran</Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Jam Operasional</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {businessHours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-surface-700">{h.day}</span>
                <input
                  type="time"
                  value={h.open}
                  disabled={!h.active}
                  onChange={(e) => {
                    const newHours = [...businessHours];
                    newHours[i] = { ...newHours[i], open: e.target.value };
                    setBusinessHours(newHours);
                  }}
                  className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500 disabled:opacity-30"
                />
                <span className="text-surface-400">&mdash;</span>
                <input
                  type="time"
                  value={h.close}
                  disabled={!h.active}
                  onChange={(e) => {
                    const newHours = [...businessHours];
                    newHours[i] = { ...newHours[i], close: e.target.value };
                    setBusinessHours(newHours);
                  }}
                  className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500 disabled:opacity-30"
                />
                <Switch checked={h.active} onChange={(v) => {
                  const newHours = [...businessHours];
                  newHours[i] = { ...newHours[i], active: v };
                  setBusinessHours(newHours);
                }} />
              </div>
            ))}
            <Button onClick={saveHours} loading={saving === 'hours'}><Save className="h-4 w-4" />Simpan Jam Operasional</Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Pengiriman</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Ongkir Dalam Kota" type="number" value={deliveryFeeCity} onChange={(e) => setDeliveryFeeCity(Number(e.target.value))} />
            <Input label="Ongkir Luar Kota" type="number" value={deliveryFeeOutside} onChange={(e) => setDeliveryFeeOutside(Number(e.target.value))} />
            <Input label="Minimal Order" type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} />
            <Input label="Estimasi Pengiriman" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Area Pengiriman</label>
              <div className="flex gap-4">
                {['city', 'outside', 'all'].map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="area" value={a} checked={deliveryArea === a} onChange={(e) => setDeliveryArea(e.target.value)} className="text-primary-600" />
                    {a === 'city' ? 'Dalam Kota' : a === 'outside' ? 'Luar Kota' : 'Semua Area'}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={saveDelivery} loading={saving === 'delivery'}><Save className="h-4 w-4" />Simpan Pengiriman</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
