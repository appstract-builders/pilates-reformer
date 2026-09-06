"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog"
import { Button } from "@/components/shared/ui/button"
import { Label } from "@/components/shared/ui/label"
import { Textarea } from "@/components/shared/ui/textarea"
import { useDbActionFeedback } from "@/components/features/admin/db-action-feedback"
import { cancelPaymentAction } from "./actions"

export function CancelPaymentButton(props: {
  paymentId: string
  userName: string
  amountLabel: string
  /** Un pago ya cobrado se anula igual, pero el aviso tiene que ser otro. */
  collected: boolean
  /** Cobro de un plan: si aún no se cobra, se da de baja el plan con él. */
  isSubscription: boolean
}) {
  const router = useRouter()
  const { showDbActionFeedback } = useDbActionFeedback()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setPending(true)
    setError(null)
    const fd = new FormData()
    fd.set("id", props.paymentId)
    fd.set("reason", reason)
    const res = await cancelPaymentAction({ success: false }, fd)
    setPending(false)
    if (res.success) {
      setOpen(false)
      setReason("")
      showDbActionFeedback("update")
      router.refresh()
      return
    }
    setError(res.error ?? "No se pudo anular el pago")
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 shrink-0 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Ban className="h-3.5 w-3.5" />
        Anular
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {props.isSubscription && !props.collected
                ? "¿Dar de baja el plan y su cobro?"
                : "¿Anular este pago?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {props.isSubscription && !props.collected
                ? `Se da de baja el plan de ${props.userName} y su cobro de ${props.amountLabel}: queda sin plan y sin nada que pagar. Las clases que ya haya reservado no se cancelan solas.`
                : props.collected
                  ? `El pago de ${props.userName} por ${props.amountLabel} deja de contar como cobrado y sale del total recaudado.`
                  : `El adeudo de ${props.userName} por ${props.amountLabel} deja de aparecer en su cuenta.`}{" "}
              Queda registrado quién lo anuló; la alumna recibe una notificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`cancel-reason-${props.paymentId}`} className="text-sm">
              Motivo (opcional)
            </Label>
            <Textarea
              id={`cancel-reason-${props.paymentId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Cobro duplicado, monto equivocado, la clase se canceló..."
              disabled={pending}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              No, volver
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void handleCancel()}
            >
              {pending
                ? "Anulando..."
                : props.isSubscription && !props.collected
                  ? "Sí, dar de baja"
                  : "Sí, anular"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
