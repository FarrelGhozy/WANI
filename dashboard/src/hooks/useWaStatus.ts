import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api.ts";
import { getErrorMessage } from "@/hooks/useToast.ts";
import type { WaStatus } from "@/types.ts";

export type { WaStatus };

/** WAHA session status enum → UI connection state. */
function toConnection(status: string | null | undefined): string {
  switch (status) {
    case "WORKING":
      return "connected";
    case "STARTING":
      return "connecting";
    default:
      return "disconnected";
  }
}

interface SessionRow {
  id: string;
  waSessionName: string;
  status: string;
  phone: string | null;
  qr: string | null;
  pairingPhone: string | null;
  pairingCode: string | null;
  updatedAt: string | null;
}

/**
 * Polls the owner's WA session through `POST /api/sessions/sync`
 * (live status + QR refresh) and exposes it as UI-friendly state.
 */
export function useWaStatus(pollInterval = 5000): WaStatus {
  const [qr, setQr] = useState("");
  const [connection, setConnection] = useState("disconnected");
  const [phone, setPhone] = useState("");
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingPhone, setPairingPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      // Sync hits WAHA for live status and refreshes the stored QR
      // while pairing is pending; returns the owner's session row.
      const res = await fetchApi<SessionRow | null>("/sessions/sync", {
        method: "POST",
      });
      const row = res.data;

      setConnection(toConnection(row?.status));
      setQr(row?.qr ?? "");
      setPhone(row?.phone ?? "");
      setConnectedAt(row?.updatedAt ?? null);
      setPairingCode(row?.pairingCode ?? null);
      setPairingPhone(row?.pairingPhone ?? null);

      setLoading(false);
      setError(null);
    } catch (e) {
      setLoading(false);
      setError(getErrorMessage(e, "Gagal memeriksa status WA"));
    }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, pollInterval);
    const initId = setTimeout(poll);
    return () => {
      clearInterval(id);
      clearTimeout(initId);
    };
  }, [poll, pollInterval]);

  return {
    qr,
    connection,
    phone,
    connectedAt,
    pairingCode,
    pairingPhone,
    loading,
    error,
  };
}
