import type { AnyDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, asc, eq, gt, ne } from "drizzle-orm"
import { INDIVIDUAL_CLASS_PLAN_ID } from "@/lib/class-charge"
import { toLocalDateStr } from "@/lib/booking-slot-options"
import { subscriptionEndOfDay } from "@/lib/subscription-dates"

export type ActivePlanSummary = {
  name: string
  /** Fin de vigencia en YYYY-MM-DD, para formatear del lado del cliente. */
  endDate: string
  /** Días completos que faltan; 0 es "vence hoy". */
  daysLeft: number
  /** Días que abarca la vigencia completa, para dibujar la barra de avance. */
  totalDays: number
  classesRemaining: number | null
  isUnlimited: boolean
  /** Los planes mensuales del estudio no cuentan clases: van por días/semana. */
  daysPerWeek: number | null
}

export type SuggestedPlan = {
  id: string
  name: string
  priceMxn: number
  totalClasses: number | null
  isUnlimited: boolean
}


/** Plan vigente de la alumna, resumido para la tarjeta del modal. */
export async function loadActivePlanSummary(
  db: AnyDb,
  subscriptionId: string,
): Promise<ActivePlanSummary | undefined> {
  const [row] = await db
    .select({
      name: schema.plan.name,
      planType: schema.plan.planType,
      daysPerWeek: schema.plan.daysPerWeek,
      startDate: schema.subscription.startDate,
      endDate: schema.subscription.endDate,
      classesRemaining: schema.subscription.classesRemaining,
      isUnlimited: schema.subscription.isUnlimited,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .where(eq(schema.subscription.id, subscriptionId))
    .limit(1)

  if (row == null) return undefined

  const end = subscriptionEndOfDay(
    row.endDate instanceof Date ? row.endDate : new Date(row.endDate as unknown as number),
  )
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const daysLeft = Math.max(
    0,
    Math.floor((end.getTime() - startOfToday.getTime()) / 86_400_000),
  )

  const start =
    row.startDate instanceof Date
      ? row.startDate
      : new Date(row.startDate as unknown as number)
  const totalDays = Math.max(
    1,
    Math.round((subscriptionEndOfDay(end).getTime() - start.getTime()) / 86_400_000),
  )

  // Un plan mensual no lleva cuenta de clases: mostrarle "0 disponibles" sería
  // mentirle a la alumna. Esos van por días por semana.
  const countsClasses = row.planType !== "monthly" && row.isUnlimited !== true

  return {
    name: row.name,
    endDate: toLocalDateStr(end),
    daysLeft,
    totalDays,
    classesRemaining: countsClasses ? (row.classesRemaining ?? 0) : null,
    isUnlimited: row.isUnlimited === true,
    daysPerWeek: row.daysPerWeek > 0 ? row.daysPerWeek : null,
  }
}

/** Planes públicos que valen la pena frente a pagar la clase suelta. */
export async function loadSuggestedPlans(
  db: AnyDb,
): Promise<SuggestedPlan[]> {
  const rows = await db
    .select({
      id: schema.plan.id,
      name: schema.plan.name,
      priceMxn: schema.plan.priceMxn,
      totalClasses: schema.plan.totalClasses,
      isUnlimited: schema.plan.isUnlimited,
    })
    .from(schema.plan)
    .where(
      and(
        eq(schema.plan.isActive, true),
        eq(schema.plan.isPublic, true),
        eq(schema.plan.isAddOn, false),
        gt(schema.plan.priceMxn, 0),
        ne(schema.plan.id, INDIVIDUAL_CLASS_PLAN_ID),
      ),
    )
    .orderBy(asc(schema.plan.priceMxn))
    .limit(3)

  return rows
}
