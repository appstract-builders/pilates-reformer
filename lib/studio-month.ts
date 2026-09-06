import { sql, type SQL } from "drizzle-orm"
import type { AnyColumn } from "drizzle-orm"
import { shouldUseSqlite } from "@/lib/db/runtime-driver"

export const STUDIO_TIMEZONE = "America/Mexico_City"

type StudioWallClock = {
  y: number
  mo: number
  d: number
  hour: number
  minute: number
}

function studioWallClock(instant: Date): StudioWallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(instant)
  return {
    y: Number(parts.find((p) => p.type === "year")?.value),
    mo: Number(parts.find((p) => p.type === "month")?.value),
    d: Number(parts.find((p) => p.type === "day")?.value),
    hour: Number(parts.find((p) => p.type === "hour")?.value),
    minute: Number(parts.find((p) => p.type === "minute")?.value),
  }
}

function studioWallClockKey(w: StudioWallClock): number {
  return w.y * 100000000 + w.mo * 1000000 + w.d * 10000 + w.hour * 100 + w.minute
}

export function studioDateStrFromInstant(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant)
}

export function studioLocalDateTimeToInstant(
  dateStr: string,
  hour: number,
  minute: number,
): Date {
  const [y, mo, d] = dateStr.split("-").map(Number)
  const targetKey = y * 100000000 + mo * 1000000 + d * 10000 + hour * 100 + minute

  let lo = Date.UTC(y, mo - 1, d, 6, 0, 0)
  let hi = Date.UTC(y, mo - 1, d + 1, 6, 0, 0)

  while (hi - lo > 60_000) {
    const mid = Math.floor((lo + hi) / 2)
    const key = studioWallClockKey(studioWallClock(new Date(mid)))
    if (key < targetKey) lo = mid
    else hi = mid
  }

  for (let t = lo; t <= hi + 60_000; t += 60_000) {
    if (studioWallClockKey(studioWallClock(new Date(t))) === targetKey) {
      // La búsqueda puede caer a mitad del minuto; el horario inicia en :00.
      return new Date(Math.floor(t / 60_000) * 60_000)
    }
  }

  return new Date(hi)
}

export function studioYearMonth(reference = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(reference)
  const y = parts.find((p) => p.type === "year")?.value ?? "1970"
  const m = parts.find((p) => p.type === "month")?.value ?? "01"
  return `${y}-${m}`
}

export function studioMonthLabel(reference = new Date()): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: STUDIO_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(reference)
}

export function paymentCreatedInStudioMonth(
  createdAtColumn: AnyColumn | SQL,
  reference = new Date(),
): SQL {
  const ym = studioYearMonth(reference)
  if (!shouldUseSqlite()) {
    return sql`to_char(${createdAtColumn}::date, 'YYYY-MM') = ${ym}`
  }
  return sql`strftime('%Y-%m', ${createdAtColumn}) = ${ym}`
}
