import { Pool } from "pg"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const url = process.env.WABOT_DATABASE_URL
    if (!url) throw new Error("WABOT_DATABASE_URL not set")
    pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5_000 })
  }
  return pool
}

export async function clearBotCreds(ownerId: string): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query('DELETE FROM "Creds" WHERE "ownerId" = $1', [ownerId])
    await client.query('DELETE FROM "SignalKey" WHERE "ownerId" = $1', [ownerId])
  } finally {
    client.release()
  }
}
