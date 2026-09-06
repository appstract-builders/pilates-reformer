/**
 * Rellena `classes_remaining` de las suscripciones mensuales que se crearon
 * cuando ese cupo no existía y quedaron en NULL.
 *
 * El cupo del periodo sale de `planIncludedClasses` (días por semana × semanas)
 * y se le restan las reservas confirmadas que la alumna ya tomó dentro del
 * periodo, para no regalarle clases que ya usó ni cobrarle las que no.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/backfill-monthly-classes.ts [--apply]
 *
 * Sin `--apply` sólo enseña lo que haría. Con --apply, detener reservas durante
 * la ejecución. Si hay periodos superpuestos o cancelaciones, exige revisión
 * manual y no escribe ningún saldo. No incluye clases cobradas individualmente.
 */

import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, eq, gte, isNull, lte, ne } from "drizzle-orm"
import { planIncludedClasses } from "@/lib/plan-quota"
import { subscriptionEndOfDay } from "@/lib/subscription-dates"

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(value as number)
}

async function main() {
  const apply = process.argv.includes("--apply")
  const db = getDb()

  const rows = await db
    .select({
      id: schema.subscription.id,
      userId: schema.subscription.userId,
      status: schema.subscription.status,
      startDate: schema.subscription.startDate,
      endDate: schema.subscription.endDate,
      isUnlimited: schema.subscription.isUnlimited,
      planName: schema.plan.name,
      planType: schema.plan.planType,
      daysPerWeek: schema.plan.daysPerWeek,
      totalClasses: schema.plan.totalClasses,
      durationDays: schema.plan.durationDays,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .where(and(
      isNull(schema.subscription.classesRemaining),
      eq(schema.subscription.status, "active"),
      eq(schema.subscription.isUnlimited, false),
      eq(schema.plan.planType, "monthly"),
    ))

  if (rows.length === 0) {
    console.log("No hay suscripciones con classes_remaining en NULL.")
    return
  }

  const changes: { id: string; remaining: number }[] = []
  let blocked = false
  let updated = 0
  for (const row of rows) {
    const included = planIncludedClasses({
      planType: row.planType,
      daysPerWeek: row.daysPerWeek,
      totalClasses: row.totalClasses,
      durationDays: row.durationDays,
      isUnlimited: row.isUnlimited === true,
    })

    if (included == null) {
      console.log(`· ${row.id} — ${row.planName}: configuración sin cupo; requiere revisión`)
      blocked = true
      continue
    }

    const start = toDate(row.startDate)
    const end = subscriptionEndOfDay(toDate(row.endDate))
    const overlapping = await db.select({ id: schema.subscription.id })
      .from(schema.subscription)
      .where(and(eq(schema.subscription.userId, row.userId), ne(schema.subscription.id, row.id),
        lte(schema.subscription.startDate, end), gte(schema.subscription.endDate, start)))
    const cancelled = await db.select({ id: schema.booking.id }).from(schema.booking)
      .where(and(eq(schema.booking.userId, row.userId), eq(schema.booking.status, "cancelled"),
        gte(schema.booking.bookingDate, start), lte(schema.booking.bookingDate, end)))
    const charged = await db.select({ bookingId: schema.payment.bookingId }).from(schema.payment)
      .where(and(eq(schema.payment.userId, row.userId), isNull(schema.payment.subscriptionId)))
    const individuallyCharged = new Set(charged.map((p) => p.bookingId))
    const taken = await db
      .select({ id: schema.booking.id })
      .from(schema.booking)
      .where(
        and(
          eq(schema.booking.userId, row.userId),
          eq(schema.booking.status, "confirmed"),
          gte(schema.booking.bookingDate, start),
          lte(schema.booking.bookingDate, end),
        ),
      )

    const used = taken.filter((b) => !individuallyCharged.has(b.id)).length
    const remaining = Math.max(0, included - used)
    if (overlapping.length > 0 || cancelled.length > 0) {
      console.log(`REVISAR ${row.id} — ${row.planName}: saldo propuesto ${remaining}; ${overlapping.length} periodos superpuestos, ${cancelled.length} cancelaciones. No se aplicará automáticamente.`)
      blocked = true
      continue
    }
    console.log(
      `· ${row.id} — ${row.planName} (${row.status}): ${included} incluidas − ${used} reservas cubiertas = ${remaining}`,
    )

    changes.push({ id: row.id, remaining })
  }

  if (blocked) {
    console.log("No se escribió ningún saldo: hay casos que requieren revisión manual.")
    process.exitCode = 1
    return
  }
  if (apply) {
    for (const change of changes) {
      const written = await db.update(schema.subscription)
        .set({ classesRemaining: change.remaining })
        .where(and(eq(schema.subscription.id, change.id), isNull(schema.subscription.classesRemaining)))
        .returning({ id: schema.subscription.id })
      updated += written.length
    }
  }

  console.log(
    apply
      ? `\nListo: ${updated} suscripciones actualizadas.`
      : `\nSimulación. Corre con --apply para escribir.`,
  )
}

void main().catch(() => {
  console.error("No se pudo completar la regularización. Revisa la conexión y el esquema.")
  process.exitCode = 1
})
