import "dotenv/config"

const SENTINEL_UUID = "00000000-0000-0000-0000-000000000000"

function getApiDbUrl(): string {
  const host = process.env.API_DATABASE_HOST ?? "localhost"
  const port = process.env.API_DATABASE_PORT ?? "5432"
  const user = process.env.API_DATABASE_USER ?? process.env.DATABASE_USER ?? "postgres"
  const password = process.env.API_DATABASE_PASSWORD ?? process.env.DATABASE_PASSWORD ?? ""
  const dbName = process.env.API_DATABASE_NAME ?? "wani_api"
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`
}

function getBotDbUrl(): string {
  const host = process.env.DATABASE_HOST ?? "localhost"
  const port = process.env.DATABASE_PORT ?? "5432"
  const user = process.env.DATABASE_USER ?? "postgres"
  const password = process.env.DATABASE_PASSWORD ?? ""
  const dbName = process.env.DATABASE_NAME ?? "wa_bot"
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const { Pool } = await import("pg")

  // 1. Get first user from wani_api
  const apiPool = new Pool({ connectionString: getApiDbUrl() })
  const userResult = await apiPool.query(
    'SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1',
  )
  await apiPool.end()

  if (userResult.rows.length === 0) {
    console.log("No users found — nothing to backfill.")
    return
  }

  const ownerId: string = userResult.rows[0].id
  console.log(`Found first user: ${ownerId}`)

  // 2. Update wa_bot Creds + SignalKey
  const botPool = new Pool({ connectionString: getBotDbUrl() })

  try {
    // Check how many rows would be affected
    const credsCount = await botPool.query(
      'SELECT COUNT(*) FROM "Creds" WHERE "ownerId" = $1',
      [SENTINEL_UUID],
    )
    const signalKeyCount = await botPool.query(
      'SELECT COUNT(*) FROM "SignalKey" WHERE "ownerId" = $1',
      [SENTINEL_UUID],
    )

    console.log(
      `Rows to update: Creds=${credsCount.rows[0].count}, SignalKey=${signalKeyCount.rows[0].count}`,
    )

    if (dryRun) {
      console.log("Dry-run mode — no changes made.")
      return
    }

    // Backfill Creds
    const credsResult = await botPool.query(
      'UPDATE "Creds" SET "ownerId" = $1 WHERE "ownerId" = $2',
      [ownerId, SENTINEL_UUID],
    )
    console.log(`Updated Creds: ${credsResult.rowCount} rows`)

    // Backfill SignalKey
    const skResult = await botPool.query(
      'UPDATE "SignalKey" SET "ownerId" = $1 WHERE "ownerId" = $2',
      [ownerId, SENTINEL_UUID],
    )
    console.log(`Updated SignalKey: ${skResult.rowCount} rows`)
  } finally {
    await botPool.end()
  }

  console.log("Backfill complete.")
}

main().catch((err) => {
  console.error("Backfill failed:", err)
  process.exit(1)
})
