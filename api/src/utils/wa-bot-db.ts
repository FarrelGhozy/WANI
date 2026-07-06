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

export async function clearBotCreds(): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query("DELETE FROM \"Creds\" WHERE id = 'pairing'")
    await client.query('DELETE FROM "SignalKey"')
  } finally {
    client.release()
  }
}
