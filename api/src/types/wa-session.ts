export type { WaSession } from "@prisma/client"

export type WaSessionData = {
  qr?: string | null
  status?: string
  phone?: string | null
}
