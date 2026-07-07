import type { PrismaClient } from "@db/client"
import { initAuthCreds, BufferJSON, type AuthenticationState } from "baileys"
import type { SignalKeyStore } from "baileys"

export async function usePrismaAuthState(
  db: PrismaClient,
  ownerId: string,
): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  const credsId = "pairing"

  const writeCreds = async (creds: AuthenticationState["creds"]) => {
    await db.creds.upsert({
      where: { ownerId_id: { ownerId, id: credsId } },
      create: { ownerId, id: credsId, data: JSON.stringify(creds, BufferJSON.replacer) },
      update: { data: JSON.stringify(creds, BufferJSON.replacer) },
    })
  }

  const readCreds = async (): Promise<AuthenticationState["creds"]> => {
    const row = await db.creds.findUnique({ where: { ownerId_id: { ownerId, id: credsId } } })
    if (row) {
      return JSON.parse(row.data, BufferJSON.reviver)
    }
    const creds = initAuthCreds()
    await writeCreds(creds)
    return creds
  }

  const keys: SignalKeyStore = {
    async get(type, ids) {
      const rows = await db.signalKey.findMany({
        where: { ownerId, type: type as string, id: { in: ids } },
      })
      const map = new Map(rows.map((r) => [r.id, r.data]))
      return Object.fromEntries(
        ids.map((id) => [id, map.has(id) ? JSON.parse(map.get(id)!, BufferJSON.reviver) : null])
      )
    },
    async set(data) {
      const deletes: Array<{ type: string; id: string }> = []
      const upserts: Array<{ type: string; id: string; data: string }> = []

      for (const [type, entries] of Object.entries(data)) {
        for (const [id, value] of Object.entries(entries!)) {
          if (value === null) {
            deletes.push({ type, id })
          } else {
            upserts.push({ type, id, data: JSON.stringify(value, BufferJSON.replacer) })
          }
        }
      }

      if (deletes.length > 0) {
        const grouped = deletes.reduce(
          (acc, { type, id }) => {
            (acc[type] ??= []).push(id)
            return acc
          },
          {} as Record<string, string[]>,
        )
        await Promise.all(
          Object.entries(grouped).map(([type, ids]) =>
            db.signalKey.deleteMany({ where: { ownerId, type, id: { in: ids } } }),
          ),
        )
      }

      if (upserts.length > 0) {
        await Promise.all(
          upserts.map(({ type, id, data }) =>
            db.signalKey.upsert({
              where: { ownerId_type_id: { ownerId, type, id } },
              create: { ownerId, type, id, data },
              update: { data },
            }),
          ),
        )
      }
    },
  }

  const creds = await readCreds()

  const state: AuthenticationState = {
    creds,
    keys,
  }

  const saveCreds = async (): Promise<void> => {
    await writeCreds(state.creds)
  }

  return {
    state,
    saveCreds,
  }
}
