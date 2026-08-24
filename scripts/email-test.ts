/**
 * Diagnóstico del envío de correo. Prueba el mismo transporte que usaría la app:
 * la API de Resend si hay RESEND_API_KEY, y si no el SMTP.
 *
 *   npm run email:test                  -> sólo verifica credenciales y conexión
 *   npm run email:test -- tu@correo.com -> además manda un correo de prueba
 *
 * No importa lib/email.ts porque ese módulo lleva "server-only" y no puede
 * cargarse fuera de Next; aquí se repiten las mismas variables de entorno.
 */
import nodemailer from "nodemailer"

const to = process.argv[2]?.trim()
const from = process.env.EMAIL_FROM?.trim() || "Appddata <feedback@appddata.com>"

async function testResend(apiKey: string): Promise<void> {
  console.log("Transporte: Resend (HTTPS)")
  console.log(`Remitente:  ${from}`)

  if (!to) {
    console.log("\nLa API de Resend no expone un chequeo sin envío.")
    console.log("Corre: npm run email:test -- tu@correo.com")
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Prueba de correo — Pilates Reformer",
      html: "<p>Si ves este mensaje, el envío por Resend quedó conectado.</p>",
      text: "Si ves este mensaje, el envío por Resend quedó conectado.",
    }),
  })

  const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null

  if (!res.ok) {
    console.error(`\n✗ Resend rechazó el envío: ${body?.message ?? `HTTP ${res.status}`}`)
    process.exit(1)
  }
  console.log(`\n✓ Correo enviado a ${to} (id ${body?.id})`)
}

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey) return testResend(apiKey)

  console.log("Transporte: SMTP")
  const user = process.env.SMTP_USER?.trim()
  const pass = (process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS)?.trim()

  if (!user || !pass) {
    console.error("Faltan SMTP_USER y SMTP_PASSWORD en .env.local")
    process.exit(1)
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "587", 10)
  const secure = process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || port === 465
  console.log(`Servidor:  ${host}:${port} (secure: ${secure})`)
  console.log(`Cuenta:    ${user}`)
  console.log(`Remitente: ${from}`)

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  try {
    await transporter.verify()
  } catch (e) {
    console.error("\n✗ La conexión falló:", e instanceof Error ? e.message : e)
    process.exit(1)
  }
  console.log("\n✓ Conexión y credenciales correctas")

  if (!to) {
    console.log("\nPara mandar un correo real: npm run email:test -- tu@correo.com")
    transporter.close()
    return
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Prueba de correo — Pilates Reformer",
      html: "<p>Si ves este mensaje, el envío por SMTP quedó conectado.</p>",
      text: "Si ves este mensaje, el envío por SMTP quedó conectado.",
    })
    console.log(`\n✓ Correo enviado a ${to} (id ${info.messageId})`)
    console.log("Revisa el remitente que aparece: si Gmail lo reescribió, el alias no está verificado.")
  } catch (e) {
    console.error("\n✗ No se pudo enviar:", e instanceof Error ? e.message : e)
    process.exit(1)
  } finally {
    transporter.close()
  }
}

void main()
