import type { AnyDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { createNotification } from "@/lib/notifications"

export type CancelPaymentResult =
  | { ok: true; droppedSubscription: boolean; wasCollected: boolean }
  | { ok: false; error: string }

function formatMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Perdona los adeudos abiertos de unas suscripciones. Se usa cuando el admin da
 * de baja el plan: ahí sí se borra lo que quedaba por cobrar. Renovar o cambiar
 * de plan NO pasa por aquí — esos adeudos se acumulan hasta que alguien decida
 * cancelarlos o cobrarlos.
 *
 * Un pago ya cobrado nunca se toca: ese dinero entró.
 */
export async function voidPendingPaymentsForSubscriptions(
  db: AnyDb,
  params: { subscriptionIds: string[]; actor: string; reason: string },
): Promise<{ voidedAmount: number; voidedCount: number }> {
  if (params.subscriptionIds.length === 0) {
    return { voidedAmount: 0, voidedCount: 0 }
  }

  const rows = await db
    .update(schema.payment)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: params.actor,
      cancelReason: params.reason,
    })
    .where(
      and(
        inArray(schema.payment.subscriptionId, params.subscriptionIds),
        eq(schema.payment.status, "pending"),
      ),
    )
    .returning({ amount: schema.payment.amount })

  return {
    voidedAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    voidedCount: rows.length,
  }
}

/**
 * Anula un pago mal capturado o una clase que ya no se va a cobrar. No borra la
 * fila: la deja en `cancelled` con quién y por qué, para que el histórico de
 * caja siga cuadrando.
 *
 * Dos reglas sobre suscripciones:
 * - Un plan ya cobrado no se toca. Ese pago es lo que sostiene un plan vigente,
 *   y anularlo dejaría a la alumna con clases pagadas que la caja no registra.
 * - Un plan que aún no se cobra se da de baja junto con su cobro: si la alumna
 *   se arrepiente no queda ni deuda ni plan. Las reservas ya hechas siguen en
 *   pie; liberarlas es decisión aparte.
 */
export async function cancelPaymentById(
  db: AnyDb,
  params: { paymentId: string; actor: string; reason?: string },
): Promise<CancelPaymentResult> {
  const reason = (params.reason ?? "").trim().slice(0, 200)

  const [row] = await db
    .select({
      id: schema.payment.id,
      userId: schema.payment.userId,
      subscriptionId: schema.payment.subscriptionId,
      amount: schema.payment.amount,
      status: schema.payment.status,
      concept: schema.payment.concept,
      userName: schema.user.name,
    })
    .from(schema.payment)
    .innerJoin(schema.user, eq(schema.payment.userId, schema.user.id))
    .where(eq(schema.payment.id, params.paymentId))
    .limit(1)

  if (row == null) {
    return { ok: false, error: "Pago no encontrado" }
  }
  if (row.status === "cancelled") {
    return { ok: false, error: "Este pago ya está anulado" }
  }

  const wasCollected = row.status === "succeeded"
  if (row.subscriptionId != null && wasCollected) {
    return {
      ok: false,
      error:
        "Un pago de suscripción ya confirmado no se puede anular. Para deshacerlo, da de baja el plan desde la cuenta de la alumna.",
    }
  }

  const droppedSubscription = row.subscriptionId != null && !wasCollected
  if (droppedSubscription && row.subscriptionId != null) {
    await db
      .update(schema.subscription)
      .set({ status: "cancelled", classesRemaining: 0 })
      .where(eq(schema.subscription.id, row.subscriptionId))
  }

  await db
    .update(schema.payment)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: params.actor,
      cancelReason: reason !== "" ? reason : null,
    })
    .where(eq(schema.payment.id, params.paymentId))

  const amountLabel = formatMxn(row.amount)
  const conceptNote = row.concept ? ` (${row.concept})` : ""
  const reasonNote = reason !== "" ? ` Motivo: ${reason}.` : ""

  await createNotification(db, {
    userId: row.userId,
    type: "payment_cancelled",
    title: droppedSubscription
      ? "Plan cancelado"
      : wasCollected
        ? "Pago anulado"
        : "Adeudo cancelado",
    body: droppedSubscription
      ? `Hola ${row.userName}, dimos de baja tu plan${conceptNote} y su cobro de ${amountLabel}.${reasonNote} No queda nada por pagar.`
      : wasCollected
        ? `Hola ${row.userName}, el estudio anuló el pago de ${amountLabel}${conceptNote}.${reasonNote} Si no lo esperabas, avísanos.`
        : `Hola ${row.userName}, dimos de baja el pago pendiente de ${amountLabel}${conceptNote}.${reasonNote} Ya no aparece en tu cuenta.`,
  })

  return { ok: true, droppedSubscription, wasCollected }
}
