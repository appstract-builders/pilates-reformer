import { CalendarDays, Package } from "lucide-react"
import { Badge } from "@/components/shared/ui/badge"
import { formatPlanTypeLabel } from "@/lib/site/plans"

export type PlanVigenteRow = {
  planName: string
  planType: string
  endDate: Date
  classesRemaining: number | null
  isUnlimited: boolean
  daysPerWeek: number | null
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Un plan mensual no lleva cuenta de clases: va por días por semana. Mostrarle
 * "0 disponibles" a la alumna sería mentirle.
 */
function includesLabel(row: PlanVigenteRow): string {
  if (row.isUnlimited) return "Clases sin límite"
  if (row.planType === "monthly") {
    return row.daysPerWeek != null && row.daysPerWeek > 0
      ? `${row.daysPerWeek} clases por semana`
      : "Clases sin límite"
  }
  const left = row.classesRemaining ?? 0
  return left === 1 ? "1 clase disponible" : `${left} clases disponibles`
}

export function PlanVigenteCard(props: { row: PlanVigenteRow | null }) {
  if (props.row == null) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-5 py-4 text-sm">
        <p className="inline-flex items-center gap-2 font-medium">
          <Package className="h-4 w-4 text-muted-foreground" />
          No tienes un plan vigente
        </p>
        <p className="mt-1 text-muted-foreground">
          Puedes reservar clases sueltas y el estudio te asigna un plan cuando lo
          contrates.
        </p>
      </div>
    )
  }

  const row = props.row

  return (
    <div className="rounded-lg border bg-card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Tu plan · {formatPlanTypeLabel(row.planType)}
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold">{row.planName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{includesLabel(row)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="border-green-200 bg-green-100 text-green-700">Vigente</Badge>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Vence {formatDate(row.endDate)}
          </span>
        </div>
      </div>
    </div>
  )
}
