import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api.ts";
import { useToast } from "@/hooks/useToast.ts";
import type { ApiKeyItem, ApiKeyScope } from "@/types.ts";
import Button from "@/components/ui/Button.tsx";
import Card from "@/components/ui/Card.tsx";
import Input from "@/components/ui/Input.tsx";

const scopeOptions: Array<{
  value: ApiKeyScope;
  label: string;
  description: string;
}> = [
  {
    value: "sessions:messages",
    label: "Pesan masuk WhatsApp",
    description: "Mengirim webhook pesan WAHA ke WANI.",
  },
  {
    value: "sessions:qr",
    label: "Status dan QR sesi",
    description: "Untuk integrasi pembaruan status sesi mendatang.",
  },
  {
    value: "chat:write",
    label: "Proses chat",
    description: "Memanggil proses chat dari service eksternal.",
  },
  {
    value: "outgoing:read",
    label: "Baca pesan keluar",
    description: "Membaca antrean pesan keluar.",
  },
  {
    value: "outgoing:write",
    label: "Ubah pesan keluar",
    description: "Memperbarui status pesan keluar.",
  },
];

function formatDate(value: string | null): string {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ApiKeysTab() {
  const [items, setItems] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("WAHA webhook");
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["sessions:messages"]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const { toast, apiError } = useToast();

  const load = useCallback(async () => {
    try {
      const response = await fetchApi<{ items: ApiKeyItem[] }>("/api-keys");
      setItems(response.data?.items ?? []);
    } catch (error) {
      apiError(error, "Gagal memuat API key");
    } finally {
      setLoading(false);
    }
  }, [apiError]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleScope(scope: ApiKeyScope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope]
    );
  }

  async function createKey() {
    if (!name.trim() || scopes.length === 0) return;
    setSaving(true);
    try {
      const response = await fetchApi<{ apiKey: ApiKeyItem; token: string }>(
        "/api-keys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), scopes, expiresInDays }),
        }
      );
      if (response.data) {
        setNewToken(response.data.token);
        setItems((current) => [response.data!.apiKey, ...current]);
      }
      toast("API key berhasil dibuat", "success");
    } catch (error) {
      apiError(error, "Gagal membuat API key");
    } finally {
      setSaving(false);
    }
  }

  async function revokeKey(item: ApiKeyItem) {
    if (!window.confirm(`Cabut akses API key “${item.name}”?`)) return;
    try {
      const response = await fetchApi<ApiKeyItem>(`/api-keys/${item.id}`, {
        method: "DELETE",
      });
      if (response.data) {
        setItems((current) =>
          current.map((key) => (key.id === item.id ? response.data! : key))
        );
      }
      toast("API key telah dicabut", "success");
    } catch (error) {
      apiError(error, "Gagal mencabut API key");
    }
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    toast("Token disalin", "success");
  }

  return (
    <div className="space-y-5">
      <Card accent="amber">
        <h2 className="text-base font-semibold text-stone-900">API key service</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Buat key terpisah untuk setiap instance WAHA atau service. Key dapat
          dicabut tanpa mengganggu instance lain dan otomatis kedaluwarsa.
        </p>
      </Card>

      {newToken && (
        <Card accent="teal">
          <h3 className="font-semibold text-stone-900">Salin token sekarang</h3>
          <p className="mt-1 text-sm text-stone-600">
            Token lengkap hanya ditampilkan sekali dan tidak dapat dilihat lagi.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-stone-900 px-3 py-2.5 text-xs text-emerald-300">
              {newToken}
            </code>
            <Button size="sm" onClick={copyToken}>Salin</Button>
            <Button size="sm" variant="ghost" onClick={() => setNewToken(null)}>
              Sudah disimpan
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-stone-900">Buat API key</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama instance"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: WAHA Produksi"
          />
          <Input
            label="Masa berlaku (hari)"
            type="number"
            min={1}
            max={365}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(Number(event.target.value))}
            hint="Maksimal 365 hari"
          />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Izin akses
          </p>
          {scopeOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-stone-200 p-3 hover:bg-stone-50"
            >
              <input
                type="checkbox"
                className="mt-1 accent-teal-600"
                checked={scopes.includes(option.value)}
                onChange={() => toggleScope(option.value)}
              />
              <span>
                <span className="block text-sm font-medium text-stone-800">
                  {option.label}
                </span>
                <span className="block text-xs text-stone-500">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          loading={saving}
          disabled={!name.trim() || scopes.length === 0}
          onClick={createKey}
        >
          Buat API key
        </Button>
      </Card>

      <Card>
        <h3 className="font-semibold text-stone-900">API key yang tersedia</h3>
        {loading ? (
          <p className="mt-4 text-sm text-stone-500">Memuat...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Belum ada API key.</p>
        ) : (
          <div className="mt-4 divide-y divide-stone-100">
            {items.map((item) => {
              const expired = new Date(item.expiresAt) <= new Date();
              const inactive = Boolean(item.revokedAt) || expired;
              return (
                <div key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-stone-900">{item.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${inactive ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-700"}`}>
                        {item.revokedAt ? "Dicabut" : expired ? "Kedaluwarsa" : "Aktif"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-stone-500">
                      wani_sk_{item.prefix}_••••••••
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Kedaluwarsa {formatDate(item.expiresAt)} · Terakhir dipakai {formatDate(item.lastUsedAt)}
                    </p>
                  </div>
                  {!inactive && (
                    <Button size="sm" variant="danger" onClick={() => revokeKey(item)}>
                      Cabut
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
