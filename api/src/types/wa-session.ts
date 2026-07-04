export type { WaSession } from "@db/client"

export type WaSessionData = {
  qr?: string | null
  status?: string
  phone?: string | null
  pairingPhone?: string | null
  pairingCode?: string | null
}
