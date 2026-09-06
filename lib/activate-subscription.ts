import type { AnyDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import {
  computeSubscriptionEndDate,
  toSubscriptionLocalDate,
} from "@/lib/subscription-dates"
import { incrementCouponUsedCount, resolveCouponForPrice } from "@/lib/coupons"
import { isSubscriptionCurrent, pickPrimarySubscription } from "@/lib/subscription-display"
import { voidPendingPaymentsForSubscriptions } from "@/lib/payment-cancellation"
import { createNotification } from "@/lib/notifications"

export async function activateSubscriptionForUser(
  db: AnyDb,
  params: {
    userId: string
    planId: string
    startDate?: Date
    billingCycle?: string
    discountPct?: number | null
    discountReason?: string | null
    couponCode?: string | null
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [selectedPlan] = await db
    .select()
    .from(schema.plan)
    .where(eq(schema.plan.id, params.planId))
    .limit(1)

  if (!selectedPlan) {
    return { ok: false, error: "Plan no encontrado" }
  }

  if (!selectedPlan.isActive) {
    return { ok: false, error: "El plan no está activo" }
  }

  const startDate = toSubscriptionLocalDate(params.startDate ?? new Date())
  const endDate = computeSubscriptionEndDate(startDate, selectedPlan.durationDays)

  let discountPct = params.discountPct ?? null
  let discountReason = params.discountReason ?? null
  let finalPrice =
    discountPct != null ? selectedPlan.priceMxn * (1 - discountPct) : selectedPlan.priceMxn
  let couponIdToIncrement: string | null = null

  const couponCode = params.couponCode?.trim() ?? ""
  if (couponCode !== "") {
    const resolved = await resolveCouponForPrice(db, couponCode, selectedPlan.priceMxn)
    if (!resolved.ok) {
      return { ok: false, error: resolved.message }
    }
    finalPrice = resolved.finalPrice
    discountPct = resolved.discountPct
    discountReason = resolved.discountReason
    couponIdToIncrement = resolved.coupon.id
  }

  const costPerClass =
    selectedPlan.totalClasses != null && selectedPlan.totalClasses > 0
      ? finalPrice / selectedPlan.totalClasses
      : null

  const isUnlimited = selectedPlan.isUnlimited ?? false
  const classesRemaining = isUnlimited ? null : (selectedPlan.totalClasses ?? null)

  const billingCycle = params.billingCycle ?? "mensual"
  const subId = crypto.randomUUID()

  const discountNote =
    discountReason != null && discountReason.startsWith("cupon:")
      ? ` (cupón ${discountReason.slice("cupon:".length)})`
      : discountPct
        ? ` (${Math.round(discountPct * 100)}% desc.)`
        : ""

  await db.insert(schema.subscription).values({
    id: subId,
    userId: params.userId,
    planId: params.planId,
    status: "active",
    startDate,
    endDate,
    classesRemaining,
    daysUsedThisWeek: 0,
    isUnlimited,
    billingCycle,
    discountPct,
    discountReason,
    costPerClass,
    paidAmount: finalPrice,
  })

  await db.insert(schema.payment).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    subscriptionId: subId,
    amount: finalPrice,
    method: billingCycle === "efectivo" ? "efectivo" : "transferencia",
    status: "pending",
    concept: `Suscripción: ${selectedPlan.name}${discountNote}`,
  })

  if (couponIdToIncrement != null) {
    await incrementCouponUsedCount(db, couponIdToIncrement)
  }

  return { ok: true }
}

/**
 * Cierra las suscripciones activas de un usuario.
 *
 * `status` distingue las dos razones por las que se cierra una: `cancelled` es
 * una baja de verdad (Reportes la cuenta como tal) y `expired` es el cierre
 * administrativo de un periodo que ya venció al renovarlo.
 *
 * `voidPendingCharges` sólo va en la baja explícita: renovar o cambiar de plan
 * no perdona lo que la alumna ya debía.
 */
export async function cancelActiveSubscriptionsForUser(
  db: AnyDb,
  userId: string,
  options?: {
    status?: "cancelled" | "expired"
    voidPendingCharges?: boolean
    actor?: string
    reason?: string
  },
) {
  const closed = await db
    .update(schema.subscription)
    .set({ status: options?.status ?? "cancelled", classesRemaining: 0 })
    .where(
      and(
        eq(schema.subscription.userId, userId),
        eq(schema.subscription.status, "active"),
      ),
    )
    .returning({ id: schema.subscription.id })

  if (options?.voidPendingCharges === true && closed.length > 0) {
    const voided = await voidPendingPaymentsForSubscriptions(db, {
      subscriptionIds: closed.map((row) => row.id),
      actor: options.actor ?? "sistema",
      reason: options.reason ?? "El plan se dio de baja",
    })

    if (voided.voidedAmount > 0) {
      const [user] = await db
        .select({ name: schema.user.name })
        .from(schema.user)
        .where(eq(schema.user.id, userId))
        .limit(1)

      await createNotification(db, {
        userId,
        type: "payment_cancelled",
        title: "Plan dado de baja",
        body: `Hola ${user?.name ?? "Usuario"}, dimos de baja tu plan y su cobro pendiente de ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(voided.voidedAmount)}. Cuando quieras volver, aquí estamos.`,
      })
    }
  }

  return closed.map((row) => row.id)
}

export async function applyUserPlan(
  db: AnyDb,
  params: {
    userId: string
    planId: string
    billingCycle?: string
    startDate?: Date
    /** Queda registrado en el pago que se anula al dar de baja el plan. */
    actor?: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const planId = params.planId.trim()

  const activeSubs = await db
    .select({
      id: schema.subscription.id,
      userId: schema.subscription.userId,
      planId: schema.subscription.planId,
      status: schema.subscription.status,
      endDate: schema.subscription.endDate,
    })
    .from(schema.subscription)
    .where(
      and(
        eq(schema.subscription.userId, params.userId),
        eq(schema.subscription.status, "active"),
      ),
    )

  const active = pickPrimarySubscription(activeSubs)

  if (planId === "") {
    if (active != null) {
      // Baja explícita: es el único camino que borra lo que quedaba por cobrar.
      await cancelActiveSubscriptionsForUser(db, params.userId, {
        voidPendingCharges: true,
        actor: params.actor ?? "sistema",
        reason: "El plan se dio de baja",
      })
    }
    return { ok: true }
  }

  if (active != null && active.planId === planId) {
    // Mismo plan: si el periodo sigue corriendo no se toca nada, para que
    // reasignarlo por error no duplique el cobro. Ya vencido, se renueva: el
    // periodo nuevo dura lo que diga el plan (7, 15 o 30 días) y trae su propio
    // cobro pendiente, que se suma a lo que la alumna ya debiera.
    if (isSubscriptionCurrent(active.status, active.endDate)) {
      return { ok: true }
    }
    await cancelActiveSubscriptionsForUser(db, params.userId, { status: "expired" })
    // Una renovación arranca hoy a propósito: heredar la fecha del formulario
    // podía abrir un periodo que nacía vencido y pedía renovarse otra vez.
    return activateSubscriptionForUser(db, {
      userId: params.userId,
      planId,
      billingCycle: params.billingCycle,
    })
  }

  if (active != null) {
    // Cambio de plan: se cierra el anterior, pero su adeudo sigue vivo.
    await cancelActiveSubscriptionsForUser(db, params.userId)
  }

  return activateSubscriptionForUser(db, {
    userId: params.userId,
    planId,
    billingCycle: params.billingCycle,
    startDate: params.startDate,
  })
}
