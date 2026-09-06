"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWeeklySchedule from "@/components/setup-weekly-schedule"
import type { WeeklyClassSelection } from "@/components/setup-weekly-schedule"
import { AgendarBookingModal } from "@/components/agendar-booking-modal"
import { routes } from "@/lib/routes"
import { useTranslation } from "@/lib/text/text-provider"
import { authClient } from "@/lib/auth-client"

export function AgendarScreen(props: {
  initialDate?: string | null
  initialSlotId?: string | null
  showIntro?: boolean
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [modalOpen, setModalOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<string | null>(props.initialDate ?? null)
  const [initialSlotId, setInitialSlotId] = useState<string | null>(props.initialSlotId ?? null)
  // Se incrementa al reservar para que el tablero vuelva a pedir cupo y clases propias.
  const [boardToken, setBoardToken] = useState(0)

  useEffect(() => {
    if (props.initialSlotId != null && props.initialSlotId !== "") {
      if (sessionPending) return
      if (session?.user == null) {
        router.replace(routes.login)
        return
      }
      setInitialDate(props.initialDate ?? null)
      setInitialSlotId(props.initialSlotId)
      setModalOpen(true)
    }
  }, [props.initialDate, props.initialSlotId, sessionPending, session?.user, router])

  function openBooking(selection?: WeeklyClassSelection) {
    if (sessionPending) return
    if (session?.user == null) {
      router.push(routes.login)
      return
    }
    if (selection != null) {
      setInitialDate(selection.bookingDate)
      setInitialSlotId(selection.slotId)
      router.replace(
        `${routes.agendar}?date=${encodeURIComponent(selection.bookingDate)}&slot=${encodeURIComponent(selection.slotId)}`,
        { scroll: false },
      )
    } else {
      setInitialDate(null)
      setInitialSlotId(null)
    }
    setModalOpen(true)
  }

  // Memoizado a propósito: el modal lleva `onBooked` en las dependencias de un
  // efecto, así que una función nueva en cada render lo vuelve a disparar. Con
  // el token de recarga eso se convertía en un bucle infinito de renders.
  const handleBooked = useCallback(() => {
    setBoardToken((n) => n + 1)
    router.refresh()
  }, [router])

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open)
    if (!open) {
      setInitialDate(null)
      setInitialSlotId(null)
      router.replace(routes.agendar, { scroll: false })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      {props.showIntro !== false ? (
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-base">{t("agendar.screen.text001")}</p>
          <h1 className="font-display text-3xl font-semibold text-[#1b1a18] sm:text-4xl">
            {t("agendar.screen.text002")}</h1>
          <p className="max-w-2xl text-sm text-black/65 sm:text-base">
            {t("agendar.screen.text003")}</p>
        </div>
      ) : null}

      <div className="rounded-card border border-green-base/20 bg-green-base p-4 text-white shadow-[0_20px_40px_rgba(27,26,24,0.12)] sm:p-6">
        <SetupWeeklySchedule onSelectClass={openBooking} reloadToken={boardToken} />
      </div>

      <AgendarBookingModal
        open={modalOpen && !sessionPending && session?.user != null}
        onOpenChange={handleModalOpenChange}
        initialDate={initialDate}
        initialSlotId={initialSlotId}
        onBooked={handleBooked}
      />
    </div>
  )
}
