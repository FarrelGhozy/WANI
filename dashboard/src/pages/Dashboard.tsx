import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useWaStatusContext } from "@/contexts/WaStatusContext.tsx";
import { useStoreContext } from "@/contexts/StoreContext.tsx";
import { useOrders } from "@/hooks/useOrders.ts";
import { useProductsContext } from "@/contexts/ProductsContext.tsx";
import { useCustomers } from "@/hooks/useCustomers.ts";
import { fetchApi } from "@/lib/api.ts";
import StatusCard from "@/components/StatusCard.tsx";
import Card from "@/components/ui/Card.tsx";
import Button from "@/components/ui/Button.tsx";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton.tsx";
import Badge from "@/components/ui/Badge.tsx";
import QRCode from "@/components/QRCode.tsx";
import {
  SignalIcon,
  BagIcon,
  ClipboardIcon,
  PeopleIcon,
  GlobeIcon,
} from "@/components/Icons.tsx";
import { formatPrice } from "@/utils/format.ts";

const statusBadgeVariant: Record<
  string,
  "amber" | "teal" | "green" | "gray" | "red"
> = {
  PENDING: "amber",
  CONFIRMED: "teal",
  PROCESSING: "green",
  COMPLETED: "gray",
  CANCELLED: "red",
};

const statusLabel: Record<string, string> = {
  PENDING: "Tertunda",
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Diproses",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function mapAccent(status: string): "teal" | "amber" | "red" {
  if (status === "connected") return "teal";
  if (status === "connecting") return "amber";
  return "red";
}

function connectionLabel(status: string): string {
  if (status === "connected") return "Terhubung";
  if (status === "connecting") return "Menghubungkan…";
  return "Terputus";
}

function formatOrderCode(id: string) {
  const part = id.split("-")[1] ?? id.slice(-4);
  return `#${part.toUpperCase().padStart(3, "0")}`;
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { qr, connection, phone } = useWaStatusContext();
  const { store, loading: storeLoading } = useStoreContext();
  const { allOrders, loading: ordersLoading } = useOrders();
  const { products, loading: prodLoading } = useProductsContext();
  const { allCustomers, loading: custLoading } = useCustomers();
  const [needsPaymentMethod, setNeedsPaymentMethod] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi<{ hasPaymentMethods: boolean }>("/store");
        if (!cancelled) setNeedsPaymentMethod(!res.data?.hasPaymentMethods);
      } catch {
        // The rest of the dashboard should stay usable if this check fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const coreLoading = ordersLoading || prodLoading || custLoading;
  const totalRevenue = useMemo(
    () =>
      allOrders
        .filter((order) => order.status === "COMPLETED")
        .reduce((sum, order) => sum + order.totalAmount, 0),
    [allOrders]
  );
  const pendingProcessOrders = useMemo(
    () =>
      allOrders.filter(
        (order) => order.status === "PENDING" || order.status === "CONFIRMED"
      ),
    [allOrders]
  );
  const activeProducts = useMemo(
    () => products.filter((product) => product.isAvailable),
    [products]
  );
  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) => product.stock === 0 || !product.isAvailable
      ),
    [products]
  );
  const unreadCustomerCount = useMemo(
    () => allCustomers.filter((customer) => customer.unreadCount > 0).length,
    [allCustomers]
  );

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (coreLoading || storeLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton variant="rectangular" className="h-48 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              className="h-32 rounded-2xl"
            />
          ))}
        </div>
        <SkeletonCard height="h-72" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100 text-teal-700 shadow-sm">
          <GlobeIcon />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Langkah pertama
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
          Selamat datang di WANI
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-stone-500">
          Siapkan profil toko dan metode pembayaran agar pelanggan bisa mulai
          berbelanja melalui WhatsApp.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/app/settings?tab=store")}>
            Siapkan Toko
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/app/settings?tab=payment")}
          >
            Atur Pembayaran
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-teal-900 px-5 py-6 text-white shadow-[0_18px_50px_-24px_rgba(19,78,74,0.65)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border-[44px] border-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium capitalize text-teal-200">
              {today}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Selamat datang, {store.businessName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-teal-100/75">
              Pantau pesanan, pelanggan, dan kesiapan toko dari satu tempat.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/app/orders")}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Lihat Pesanan
            </button>
            <button
              onClick={() => navigate("/app/products/new")}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              Tambah Produk
            </button>
          </div>
        </div>
      </section>

      {needsPaymentMethod && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Metode pembayaran belum tersedia
              </p>
              <p className="mt-0.5 text-xs leading-5 text-amber-700">
                Lengkapi sekarang agar pelanggan bisa menyelesaikan pesanan.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app/settings?tab=payment")}
            className="self-start text-sm font-semibold text-amber-900 underline decoration-amber-400 underline-offset-4 hover:text-amber-700 sm:self-auto"
          >
            Atur pembayaran
          </button>
        </div>
      )}

      <section aria-label="Ringkasan bisnis">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            Ringkasan
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950">
            Kondisi toko saat ini
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Total pendapatan"
            value={formatPrice(totalRevenue)}
            accent="teal"
            icon={<BagIcon />}
            subText="Dari seluruh pesanan selesai"
          />
          <StatusCard
            label="Perlu diproses"
            value={String(pendingProcessOrders.length)}
            accent={pendingProcessOrders.length > 0 ? "amber" : "teal"}
            icon={<ClipboardIcon />}
            subText={
              pendingProcessOrders.length > 0
                ? "Menunggu tindakan Anda"
                : "Semua pesanan sudah beres"
            }
          />
          <StatusCard
            label="Produk aktif"
            value={`${activeProducts.length}/${products.length}`}
            accent={activeProducts.length > 0 ? "teal" : "red"}
            icon={<BagIcon />}
            subText={`${lowStockProducts.length} produk perlu perhatian`}
          />
          <StatusCard
            label="Pelanggan"
            value={String(allCustomers.length)}
            accent="teal"
            icon={<PeopleIcon />}
            subText={
              unreadCustomerCount > 0
                ? `${unreadCustomerCount} percakapan belum dibaca`
                : "Tidak ada pesan baru"
            }
          />
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <Card className="overflow-hidden" padding={false}>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-stone-950">
                Pesanan terbaru
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Pesanan yang membutuhkan perhatian Anda
              </p>
            </div>
            <button
              onClick={() => navigate("/app/orders")}
              className="text-xs font-semibold text-teal-700 transition hover:text-teal-900"
            >
              Lihat semua <span aria-hidden="true">→</span>
            </button>
          </div>

          {pendingProcessOrders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-sm font-semibold text-stone-900">
                Semua pesanan sudah diproses
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Pesanan baru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {pendingProcessOrders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/app/orders/${order.id}`)}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-stone-50/80 focus:bg-stone-50 focus:outline-none sm:grid-cols-[minmax(0,1.2fr)_minmax(100px,0.7fr)_auto] sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-400">
                        {formatOrderCode(order.id)} · {formatOrderTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="hidden text-sm font-semibold text-stone-700 sm:block">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant[order.status]} dot>
                      {statusLabel[order.status]}
                    </Badge>
                    <span className="text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600">
                      ›
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    connection === "connected"
                      ? "bg-emerald-50 text-emerald-600"
                      : connection === "connecting"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  <SignalIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-950">
                    WhatsApp
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {phone || "Kanal penjualan utama"}
                  </p>
                </div>
              </div>
              <Badge variant={mapAccent(connection)} dot>
                {connectionLabel(connection)}
              </Badge>
            </div>
            {connection === "disconnected" || connection === "connecting" ? (
              <div className="mt-5 rounded-xl bg-stone-50 p-4">
                <div className="flex flex-col items-center gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
                  <QRCode value={qr} />
                  <p className="text-center text-xs leading-5 text-stone-500 sm:text-left xl:text-center 2xl:text-left">
                    Scan kode QR melalui WhatsApp untuk mulai menerima pesan
                    pelanggan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Bot aktif dan siap melayani pelanggan
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-stone-950">
                  Perhatian stok
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Produk yang perlu ditinjau
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BagIcon />
              </div>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-emerald-600 shadow-sm">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Semua stok aman
                  </p>
                  <p className="mt-0.5 text-[11px] text-emerald-700/70">
                    Belum ada produk yang perlu ditinjau.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-1">
                {lowStockProducts.slice(0, 4).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/app/products/${product.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
                  >
                    <span className="truncate text-xs font-medium text-stone-700">
                      {product.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        product.stock === 0
                          ? "bg-red-50 text-red-600"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {product.isAvailable ? `Stok ${product.stock}` : "Nonaktif"}
                    </span>
                  </button>
                ))}
                {lowStockProducts.length > 4 && (
                  <button
                    onClick={() => navigate("/app/products")}
                    className="mt-2 w-full text-center text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Lihat {lowStockProducts.length - 4} produk lainnya
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
