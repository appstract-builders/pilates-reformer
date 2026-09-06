import { hashPassword } from "better-auth/crypto"
import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { applyUserPlan } from "@/lib/activate-subscription"
import { createBookingForUser } from "@/lib/booking-service"
async function main() {
  const db = getDb()
  const [u] = await db.select({ id: schema.user.id }).from(schema.user)
    .where(eq(schema.user.email, "isaac_odriozola@outlook.com")).limit(1)
  await db.update(schema.account).set({ password: await hashPassword("Probe12345!") })
    .where(and(eq(schema.account.userId, u.id), eq(schema.account.providerId, "credential")))
  await db.delete(schema.booking).where(eq(schema.booking.userId, u.id))
  await db.delete(schema.payment).where(eq(schema.payment.userId, u.id))
  await db.delete(schema.subscription).where(eq(schema.subscription.userId, u.id))
  await applyUserPlan(db, { userId: u.id, planId: "plan-equilibrio-quincenal", billingCycle: "quincenal" })
  const slots = await db.select({ id: schema.scheduleSlot.id, dow: schema.scheduleSlot.dayOfWeek, t: schema.scheduleSlot.startTime })
    .from(schema.scheduleSlot).where(eq(schema.scheduleSlot.isActive, true))
    .orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.startTime))
  // Una FUTURA (lunes 14) y una PASADA (lunes 31 ago, ya ocurrió) para ver ambos casos.
  const s1 = slots.find(x => x.dow === 1)!
  await createBookingForUser(db, { userId: u.id, scheduleSlotId: s1.id, bookingDate: new Date("2026-09-14T12:00:00"), birthdate: null })
  await db.insert(schema.booking).values({
    id: crypto.randomUUID(), userId: u.id, scheduleSlotId: s1.id,
    bookingDate: new Date("2026-08-31T12:00:00"), status: "confirmed", createdAt: new Date(),
  })
  console.log("reservas listas: 14 sep (futura) y 31 ago (ya pasó)")
}
void main()
