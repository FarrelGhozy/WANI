'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  Palette,
  Layout,
  Type,
  EyeOff,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useMerchant } from '@/lib/auth-context';

interface WebStoreData {
  id: string;
  slug: string;
  template: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  heroImage: string | null;
  heroText: string | null;
  customDomain: string | null;
  theme: {
    colors?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string };
    fonts?: { heading?: string; body?: string };
    layout?: { style?: string; rounded?: boolean; shadows?: boolean };
  } | null;
}

interface Template {
  name: string;
  label: string;
  thumbnail: string | null;
}

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

const colorPresets = [
  { label: 'Indigo', primary: '#6366F1', secondary: '#F59E0B', accent: '#10B981', bg: '#FFFFFF', text: '#1E293B' },
  { label: 'Emerald', primary: '#059669', secondary: '#D97706', accent: '#7C3AED', bg: '#FFFFFF', text: '#1E293B' },
  { label: 'Rose', primary: '#E11D48', secondary: '#F59E0B', accent: '#0EA5E9', bg: '#FFFBFB', text: '#1E293B' },
  { label: 'Navy', primary: '#1E3A5F', secondary: '#F59E0B', accent: '#10B981', bg: '#FFFFFF', text: '#1E293B' },
  { label: 'Warm', primary: '#B45309', secondary: '#047857', accent: '#7C3AED', bg: '#FFFAF5', text: '#292524' },
];

export default function WebStorePage() {
  const { merchant, isLoading: authLoading } = useMerchant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');

  // ─── Form State ───
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState('default');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [heroText, setHeroText] = useState('');

  const [layoutStyle, setLayoutStyle] = useState('modern');
  const [rounded, setRounded] = useState(true);
  const [shadows, setShadows] = useState(true);

  const [colorPrimary, setColorPrimary] = useState('#6366F1');
  const [colorSecondary, setColorSecondary] = useState('#F59E0B');
  const [colorAccent, setColorAccent] = useState('#10B981');
  const [colorBg, setColorBg] = useState('#FFFFFF');
  const [colorText, setColorText] = useState('#1E293B');

  const fetchData = useCallback(async () => {
    setError('');
    if (!merchant) return;
    const merchantId = merchant.id;

    const [storeRes, templateRes] = await Promise.all([
      api.get<{ data: WebStoreData }>(`/web-store/${merchantId}`),
      api.get<{ data: Template[] }>('/templates'),
    ]);

    if (templateRes.success && templateRes.data?.data) {
      setTemplates(templateRes.data.data);
    }

    if (storeRes.success && storeRes.data?.data) {
      const s = storeRes.data.data;
      setIsPublished(s.isPublished);
      setSlug(s.slug);
      setTemplate(s.template);
      setSeoTitle(s.seoTitle || '');
      setSeoDesc(s.seoDesc || '');
      setHeroImage(s.heroImage || '');
      setHeroText(s.heroText || '');
      setPreviewUrl(`${STORE_URL}/store/${s.slug}`);

      if (s.theme?.layout) {
        setLayoutStyle(s.theme.layout.style || 'modern');
        setRounded(s.theme.layout.rounded ?? true);
        setShadows(s.theme.layout.shadows ?? true);
      }
      if (s.theme?.colors) {
        if (s.theme.colors.primary) setColorPrimary(s.theme.colors.primary);
        if (s.theme.colors.secondary) setColorSecondary(s.theme.colors.secondary);
        if (s.theme.colors.accent) setColorAccent(s.theme.colors.accent);
        if (s.theme.colors.background) setColorBg(s.theme.colors.background);
        if (s.theme.colors.text) setColorText(s.theme.colors.text);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    if (!merchant) {
      setError('Gagal memuat data merchant');
      setSaving(false);
      return;
    }
    const merchantId = merchant.id;

    const res = await api.put(`/web-store/${merchantId}`, {
      slug: slug || undefined,
      template,
      seoTitle: seoTitle || undefined,
      seoDesc: seoDesc || undefined,
      heroImage: heroImage || undefined,
      heroText: heroText || undefined,
      theme: {
        colors: { primary: colorPrimary, secondary: colorSecondary, accent: colorAccent, background: colorBg, text: colorText },
        layout: { style: layoutStyle, rounded, shadows },
      },
    });

    setSaving(false);
    if (res.success) {
      showSuccess('Pengaturan toko berhasil disimpan');
      setPreviewUrl(`${STORE_URL}/store/${slug}`);
    } else {
      setError(res.error || 'Gagal menyimpan');
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError('');
    if (!merchant) return;
    const merchantId = merchant.id;

    if (isPublished) {
      await api.post(`/web-store/${merchantId}/unpublish`, {});
      setIsPublished(false);
    } else {
      await api.post(`/web-store/${merchantId}/publish`, {});
      setIsPublished(true);
    }

    setPublishing(false);
    showSuccess(isPublished ? 'Toko ditutup' : 'Toko diterbitkan!');
  }

  function applyColorPreset(preset: (typeof colorPresets)[0]) {
    setColorPrimary(preset.primary);
    setColorSecondary(preset.secondary);
    setColorAccent(preset.accent);
    setColorBg(preset.bg);
    setColorText(preset.text);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Web Store</h1>

      <div className="space-y-6 max-w-2xl">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />{success}
          </div>
        )}

        {/* ─── Status ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Status Toko</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-900">
                  {isPublished ? 'Toko sedang aktif' : 'Toko tidak aktif'}
                </p>
                <p className="text-sm text-surface-500">
                  {isPublished
                    ? 'Pelanggan bisa melihat toko online kamu'
                    : 'Toko hanya terlihat oleh kamu'}
                </p>
              </div>
              <Button
                variant={isPublished ? 'secondary' : 'primary'}
                onClick={handlePublish}
                loading={publishing}
              >
                {isPublished ? (
                  <><EyeOff className="h-4 w-4" />Tutup Toko</>
                ) : (
                  <><Eye className="h-4 w-4" />Terbitkan</>
                )}
              </Button>
            </div>
            {previewUrl && isPublished && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
              >
                <Link2 className="h-3.5 w-3.5" />
                {previewUrl}
              </a>
            )}
          </div>
        </Card>

        {/* ─── Tampilan ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />Tampilan</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Template</label>
              <div className="grid grid-cols-3 gap-3">
                {templates.length > 0 ? templates.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTemplate(t.name)}
                    className={`rounded-lg border-2 p-3 text-center text-sm transition-all ${
                      template === t.name
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {t.thumbnail && (
                      <img src={t.thumbnail} alt={t.label} className="mb-2 w-full rounded" />
                    )}
                    {t.label}
                  </button>
                )) : (
                  ['modern', 'minimal', 'classic'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTemplate(s === 'default' ? 'default' : s)}
                      className={`rounded-lg border-2 p-3 text-center text-sm capitalize transition-all ${
                        template === s
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Gaya Layout</label>
              <div className="flex gap-3">
                {['modern', 'minimal', 'classic'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLayoutStyle(s)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm capitalize transition-all ${
                      layoutStyle === s
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <Switch checked={rounded} onChange={setRounded} label="Sudut membulat" />
              <Switch checked={shadows} onChange={setShadows} label="Bayangan" />
            </div>
          </div>
        </Card>

        {/* ─── Warna ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Warna</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyColorPreset(p)}
                  className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs text-surface-600 hover:bg-surface-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Utama" value={colorPrimary} onChange={setColorPrimary} />
              <ColorInput label="Aksen" value={colorSecondary} onChange={setColorSecondary} />
              <ColorInput label="Hijau" value={colorAccent} onChange={setColorAccent} />
              <ColorInput label="Latar" value={colorBg} onChange={setColorBg} />
              <ColorInput label="Teks" value={colorText} onChange={setColorText} />
            </div>
          </div>
        </Card>

        {/* ─── Hero & SEO ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" />Hero & SEO</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Gambar Hero (URL)" value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="https://example.com/banner.jpg" />
            {heroImage && (
              <img src={heroImage} alt="Preview" className="h-32 w-full rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <Input label="Teks Hero" value={heroText} onChange={(e) => setHeroText(e.target.value)} placeholder="Selamat datang di toko kami" />
            <Input label="Judul SEO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Toko Saya | Jual Produk Berkualitas" />
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Deskripsi SEO</label>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                placeholder="Toko online terlengkap..."
                rows={3}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Slug URL" value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())} placeholder="toko-namaku" />
              <Input label="Domain Kustom" value={slug} disabled placeholder="tokoku.com (opsional)" />
            </div>
          </div>
        </Card>

        {/* ─── Actions ─── */}
        <div className="flex gap-3">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />Simpan Pengaturan
          </Button>
          {previewUrl && isPublished && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Eye className="h-4 w-4" />Lihat Toko
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-surface-300 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-primary-500"
        />
      </div>
    </div>
  );
}
