import { loadLandingScheduleBoard } from "@/lib/site/schedule-board.server"

export const dynamic = "force-dynamic"

/** Cupo agregado público: no incluye identidades ni depende de la sesión. */
export async function GET() {
  try {
    return Response.json(await loadLandingScheduleBoard(), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return Response.json({ error: "No se pudo consultar el cupo" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
