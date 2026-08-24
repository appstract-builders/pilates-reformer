import "server-only"

import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { hydrate } from "@/lib/db/schema"
import { hydrate as hydratePg } from "@/lib/db/schema.pg"
import { getHydrateDb } from "./db"
import fallbackContent from "./fallback.pilates-reformer.json"
import type { TextResources } from "./types"

const PROJECT_SLUG = process.env.APPSTRACT_PROJECT_SLUG ?? "pilates-reformer"
const SUPPORTED_LOCALES = new Set(["es"])
const CACHE_TTL_MS = Number(process.env.HYDRATE_CACHE_TTL_MS ?? 10_000)
let cache: TextResources | null = null
let cachedAt = 0

function setDeep(root: Record<string, unknown>, segments: string[], value: string) {
  let node = root
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    if (typeof node[segment] !== "object" || node[segment] === null) {
      if (segment in node) return
      node[segment] = {}
    }
    node = node[segment] as Record<string, unknown>
  }
  node[segments[segments.length - 1]] = value
}

function rowsToResources(rows: Array<{ contentKey: string; contentValue: string }>) {
  const resources: TextResources = {}
  for (const row of rows) {
    const segments = row.contentKey.split(".").filter(Boolean)
    if (segments.length < 2 || !SUPPORTED_LOCALES.has(segments[0])) continue
    setDeep(resources, segments, row.contentValue)
  }
  return resources
}

const fallbackRows = Object.entries(fallbackContent).map(([contentKey, contentValue]) => ({ contentKey, contentValue }))

export async function getHydratedResources(): Promise<TextResources> {
  const now = Date.now()
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache
  let databaseRows: Array<{ contentKey: string; contentValue: string }> = []
  try {
    // `hydrate` vive en la base de appddata, no en la propia. Con
    // APPSTRACT_DATABASE_URL se lee de alla; sin ella -desarrollo local- se
    // sigue leyendo el SQLite de la app, que si trae la tabla.
    const hydrateDb = getHydrateDb()
    databaseRows = hydrateDb
      ? await hydrateDb.select({ contentKey: hydratePg.contentKey, contentValue: hydratePg.contentValue }).from(hydratePg).where(eq(hydratePg.projectSlug, PROJECT_SLUG))
      : await getDb().select({ contentKey: hydrate.contentKey, contentValue: hydrate.contentValue }).from(hydrate).where(eq(hydrate.projectSlug, PROJECT_SLUG))
  } catch (error) {
    console.info("Textos de hydrate no disponibles; se usará el fallback local.", error)
  }
  cache = rowsToResources([...fallbackRows, ...databaseRows])
  cachedAt = now
  return cache
}
