import "server-only"

import nodemailer, { type Transporter } from "nodemailer"

/**
 * Dos transportes, y el motivo es la red, no la preferencia.
 *
 * Los nodos de DigitalOcean filtran el correo saliente: desde el cluster los
 * puertos 587 y 465 dan ETIMEDOUT mientras el 443 responde normal. Por eso en
 * producción se envía por la API HTTPS del ESP, que no toca esos puertos, y en
 * desarrollo se deja el SMTP de Google Workspace, que ahí sí funciona y no
 * consume cuota del ESP.
 *
 * Manda quien esté configurado: si hay RESEND_API_KEY se usa la API; si no,
 * SMTP. Así el mismo build sirve en los dos lados sin ramas por entorno.
 */
const DEFAULT_FROM = "Appddata <feedback@appddata.com>"
const DEFAULT_SMTP_HOST = "smtp.gmail.com"
const DEFAULT_SMTP_PORT = 587
const RESEND_ENDPOINT = "https://api.resend.com/emails"

function readEnv(name: string): string | null {
  const raw = process.env[name]
  if (raw == null) return null
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

function readSmtpConfig(): SmtpConfig | null {
  const user = readEnv("SMTP_USER")
  const password = readEnv("SMTP_PASSWORD") ?? readEnv("SMTP_PASS")
  if (user == null || password == null) return null

  const portRaw = readEnv("SMTP_PORT")
  const parsedPort = portRaw == null ? DEFAULT_SMTP_PORT : Number.parseInt(portRaw, 10)
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_SMTP_PORT

  // 465 es SMTPS (TLS desde el saludo); 587 abre en claro y sube a TLS con STARTTLS.
  const secureRaw = readEnv("SMTP_SECURE")
  const secure = secureRaw == null ? port === 465 : secureRaw.toLowerCase() === "true"

  return {
    host: readEnv("SMTP_HOST") ?? DEFAULT_SMTP_HOST,
    port,
    secure,
    user,
    password,
  }
}

export type EmailTransport = "resend" | "smtp"

/** Qué transporte se va a usar, o null si no hay ninguno configurado. */
export function getEmailTransport(): EmailTransport | null {
  if (readEnv("RESEND_API_KEY") != null) return "resend"
  if (readSmtpConfig() != null) return "smtp"
  return null
}

export function isEmailConfigured(): boolean {
  return getEmailTransport() != null
}

/**
 * Remitente del correo. Con la API del ESP el dominio debe estar verificado ahí;
 * con SMTP de Google debe ser la propia cuenta o un alias suyo verificado en
 * Gmail, o Google reescribe el remitente con la dirección de SMTP_USER.
 */
export function getEmailFrom(): string {
  return readEnv("EMAIL_FROM") ?? readEnv("SMTP_FROM") ?? DEFAULT_FROM
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string }

type EmailParams = {
  to: string
  subject: string
  html: string
  text: string
}

// El transporte SMTP mantiene el pool de conexiones: crearlo por correo obliga a
// un handshake TLS nuevo cada vez.
let cachedTransporter: { key: string; transporter: Transporter } | null = null

function getTransporter(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`
  if (cachedTransporter?.key === key) return cachedTransporter.transporter

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  })

  cachedTransporter = { key, transporter }
  return transporter
}

async function sendBySmtp(config: SmtpConfig, params: EmailParams): Promise<SendEmailResult> {
  try {
    const info = await getTransporter(config).sendMail({
      from: getEmailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (info.rejected.length > 0) {
      return { ok: false, error: `El servidor rechazó el destinatario: ${params.to}` }
    }

    return { ok: true, id: info.messageId }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red"
    return { ok: false, error: `No se pudo enviar por SMTP: ${msg}` }
  }
}

async function sendByResend(apiKey: string, params: EmailParams): Promise<SendEmailResult> {
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    })

    const body: unknown = await res.json().catch(() => null)

    if (!res.ok) {
      const detail =
        body != null && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : `HTTP ${res.status}`
      return { ok: false, error: `Resend rechazó el envío: ${detail}` }
    }

    const id =
      body != null && typeof body === "object" && "id" in body
        ? String((body as { id: unknown }).id)
        : null

    if (id == null) return { ok: false, error: "Resend no devolvió un identificador de envío" }

    return { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red"
    return { ok: false, error: `No se pudo contactar a Resend: ${msg}` }
  }
}

export async function sendEmail(params: EmailParams): Promise<SendEmailResult> {
  const apiKey = readEnv("RESEND_API_KEY")
  if (apiKey != null) return sendByResend(apiKey, params)

  const smtp = readSmtpConfig()
  if (smtp != null) return sendBySmtp(smtp, params)

  return {
    ok: false,
    error: "No hay transporte de correo configurado (falta RESEND_API_KEY o SMTP_USER/SMTP_PASSWORD)",
  }
}
