import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
const USERS = [
  { id: "probe-s10-adm", role: "admin", name: "Sonda Admin", did: null },
  { id: "probe-s10-alu", role: "alumno", name: "Sonda Alumna", did: "ST9995" },
  { id: "probe-s10-coa", role: "coach", name: "Sonda Coach", did: null },
]
async function main() {
  const db = getDb()
  if (process.argv[2] === "del") {
    for (const u of USERS) {
      await db.delete(schema.session).where(eq(schema.session.userId, u.id))
      await db.delete(schema.account).where(eq(schema.account.userId, u.id))
      await db.delete(schema.user).where(eq(schema.user.id, u.id))
    }
    console.log("borrado"); return
  }
  const hashed = await hashPassword("SondaS10123")
  for (const u of USERS) {
    await db.insert(schema.user).values({
      id: u.id, name: u.name, email: `${u.id}@example.test`, emailVerified: true,
      role: u.role, displayId: u.did, idPrefix: "ST", enabled: true,
    })
    await db.insert(schema.account).values({
      id: `${u.id}-c`, userId: u.id, accountId: u.id, providerId: "credential", password: hashed,
    })
  }
  console.log("creados")
}
main().then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1) })
