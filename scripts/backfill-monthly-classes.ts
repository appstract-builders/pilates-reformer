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
 * Sin `--apply` sólo enseña lo que haría.
 */

import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, eq, gte, isNull, lte } from "drizzle-orm"
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
      userName: schema.user.name,
      planName: schema.plan.name,
      planType: schema.plan.planType,
      daysPerWeek: schema.plan.daysPerWeek,
      totalClasses: schema.plan.totalClasses,
      durationDays: schema.plan.durationDays,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .innerJoin(schema.user, eq(schema.subscription.userId, schema.user.id))
    .where(isNull(schema.subscription.classesRemaining))

  if (rows.length === 0) {
    console.log("No hay suscripciones con classes_remaining en NULL.")
    return
  }

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
      console.log(`· ${row.userName} — ${row.planName}: sin cupo (ilimitado), se deja en NULL`)
      continue
    }

    const start = toDate(row.startDate)
    const end = subscriptionEndOfDay(toDate(row.endDate))
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

    const remaining = Math.max(0, included - taken.length)
    console.log(
      `· ${row.userName} — ${row.planName} (${row.status}): ${included} incluidas − ${taken.length} tomadas = ${remaining}`,
    )

    if (apply) {
      await db
        .update(schema.subscription)
        .set({ classesRemaining: remaining })
        .where(eq(schema.subscription.id, row.id))
      updated += 1
    }
  }

  console.log(
    apply
      ? `\nListo: ${updated} suscripciones actualizadas.`
      : `\nSimulación. Corre con --apply para escribir.`,
  )
}

void main()
