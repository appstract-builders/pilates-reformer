import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
const ALU = "probe-s9-alu"
const FILL = "probe-s9-fill"
async function main() {
  const db = getDb()
  if (process.argv[2] === "del") {
    for (const id of [ALU, FILL]) {
      await db.delete(schema.payment).where(eq(schema.payment.userId, id))
      await db.delete(schema.booking).where(eq(schema.booking.userId, id))
      await db.delete(schema.notification).where(eq(schema.notification.userId, id))
      await db.delete(schema.session).where(eq(schema.session.userId, id))
      await db.delete(schema.account).where(eq(schema.account.userId, id))
      await db.delete(schema.user).where(eq(schema.user.id, id))
    }
    console.log("borrado"); return
  }
  for (const [id, name, mail, did] of [
    [ALU, "Sonda Alumna", "probe-s9@example.test", "ST9990"],
    [FILL, "Relleno", "probe-s9f@example.test", "ST9991"],
  ] as const) {
    await db.insert(schema.user).values({
      id, name, email: mail, emailVerified: true, role: "alumno",
      displayId: did, idPrefix: "ST", enabled: true, birthdate: "1995-05-05",
    })
  }
  await db.insert(schema.account).values({
    id: `${ALU}-c`, userId: ALU, accountId: ALU, providerId: "credential",
    issuer: "local:credential",
    password: await hashPassword("SondaS9123"),
  })
  // Dos fechas distintas del mismo día de la semana, con cupo distinto
  const d1 = new Date(); d1.setDate(d1.getDate() + 2); d1.setHours(12,0,0,0)
  const d2 = new Date(d1); d2.setDate(d2.getDate() + 7)
  const slots = await db.select().from(schema.scheduleSlot)
    .where(eq(schema.scheduleSlot.dayOfWeek, d1.getDay()))
  const s = slots[0]
  for (let i = 0; i < 4; i++) {
    await db.insert(schema.booking).values({
      id: crypto.randomUUID(), userId: FILL, scheduleSlotId: s.id, bookingDate: d1, status: "confirmed",
    })
  }
  for (let i = 0; i < 9; i++) {
    await db.insert(schema.booking).values({
      id: crypto.randomUUID(), userId: FILL, scheduleSlotId: s.id, bookingDate: d2, status: "confirmed",
    })
  }
  console.log(JSON.stringify({
    fecha1: d1.toISOString().slice(0,10),
    fecha2: d2.toISOString().slice(0,10),
    slot: s.startTime,
  }))
}
main().then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1) })
