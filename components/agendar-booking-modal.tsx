"use client"

import { startTransition, useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { CircleCheck, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/ui/dialog"
import { DbActionSuccessEffect } from "@/components/features/admin/db-action-feedback"
import { authClient } from "@/lib/auth-client"
import { signInByDisplayId } from "@/lib/sign-in-by-display-id"
import {
  type BookingSlotOption,
  filterSlotsForBookingDate,
  formatBookingDateEs,
  formatSlotLabel,
  getDayOfWeekFromDateStr,
  nextDateWithSlots,
  resolveBookingDefaultDate,
} from "@/lib/booking-slot-options"
import {
  checkPublicBookingEligibility,
  createPublicBookingAction,
  loadAgendarDataAction,
  loadDayAvailabilityAction,
  type ActivePlanSummary,
  type AgendarData,
  type PublicBookingState,
  type SuggestedPlan,
} from "@/app/agendar/actions"
import { routes } from "@/lib/routes"
import { useTranslation } from "@/lib/text/text-provider"

function formatMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPlanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return dateStr
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  })
}

async function waitForSessionUser() {
  for (let i = 0; i < 40; i++) {
    const s = await authClient.getSession()
    if (s.data?.user != null) {
      return s.data.user
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 150)
    })
  }
  return null
}

function AgendarBookingForm(props: {
  slots: BookingSlotOption[]
  defaultDate: string
  todayStr: string
  disabledSlotDateKeys: string[]
  bookedBySlotDate: Record<string, number>
  initialDate?: string
  initialSlotId?: string
  onClose: () => void
  onBooked?: () => void
}) {
  const { t } = useTranslation()
  const [state, formAction, pending] = useActionState<PublicBookingState, FormData>(
    createPublicBookingAction,
    { success: false },
  )
  const { data: sessionData } = authClient.useSession()
  const sessionUser = sessionData?.user ?? null

  const [scheduleSlotId, setScheduleSlotId] = useState(() => props.initialSlotId ?? "")
  const [bookingDate, setBookingDate] = useState(() =>
    props.initialDate && props.initialDate !== ""
      ? props.initialDate
      : resolveBookingDefaultDate(props.defaultDate, props.slots, props.disabledSlotDateKeys),
  )
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [checkOk, setCheckOk] = useState<boolean | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginDisplayId, setLoginDisplayId] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginPending, setLoginPending] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string
    slotId: string
    userName: string
  } | null>(null)
  const [willBeCharged, setWillBeCharged] = useState<{
    priceMxn: number
    planName: string
  } | null>(null)
  const [trialAvailable, setTrialAvailable] = useState(false)
  const [useTrialClass, setUseTrialClass] = useState(false)
  const [activePlan, setActivePlan] = useState<ActivePlanSummary | null>(null)
  const [suggestedPlans, setSuggestedPlans] = useState<SuggestedPlan[]>([])
  // Cupo real de la fecha elegida; se recarga al cambiarla y tras reservar.
  const [dayBooked, setDayBooked] = useState<Record<string, number> | null>(null)
  const [loadingDay, setLoadingDay] = useState(false)
  const { onBooked } = props

  const dayOfWeek = getDayOfWeekFromDateStr(bookingDate)
  const slotsForDay = filterSlotsForBookingDate(
    props.slots,
    bookingDate,
    props.disabledSlotDateKeys,
  ).map((slot) => {
    const booked =
      dayBooked != null
        ? (dayBooked[slot.id] ?? 0)
        : (props.bookedBySlotDate[`${slot.id}|${bookingDate}`] ?? 0)
    return { ...slot, booked, free: Math.max(0, slot.capacity - booked) }
  })
  const nextDate = nextDateWithSlots(bookingDate, props.slots, props.disabledSlotDateKeys)
  const canUseNextDate =
    bookingDate !== "" &&
    slotsForDay.length === 0 &&
    nextDate !== bookingDate &&
    filterSlotsForBookingDate(props.slots, nextDate, props.disabledSlotDateKeys).length > 0
  const canSubmit =
    bookingDate !== "" && scheduleSlotId !== "" && slotsForDay.length > 0

  const isCurrentBookingConfirmed =
    confirmedBooking != null &&
    confirmedBooking.date === bookingDate &&
    confirmedBooking.slotId === scheduleSlotId

  const sessionDisplayIdRaw =
    sessionUser != null ? (sessionUser as { displayId?: string | null }).displayId : null
  const sessionDisplayId =
    typeof sessionDisplayIdRaw === "string" && sessionDisplayIdRaw.trim() !== ""
      ? sessionDisplayIdRaw
      : null

  useEffect(() => {
    if (bookingDate === "") {
      setDayBooked(null)
      return
    }
    let cancelled = false
    setLoadingDay(true)
    setDayBooked(null)
    loadDayAvailabilityAction(bookingDate)
      .then((porSlot) => {
        if (!cancelled) setDayBooked(porSlot)
      })
      .finally(() => {
        if (!cancelled) setLoadingDay(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookingDate])

  useEffect(() => {
    if (!scheduleSlotId) return
    const valid = slotsForDay.some((s) => s.id === scheduleSlotId && s.free > 0)
    if (!valid) {
      setScheduleSlotId("")
    }
  }, [bookingDate, slotsForDay, scheduleSlotId])

  useEffect(() => {
    if (state.success && state.message) {
      const confirmedName = state.message.replace(/, tu clase quedó confirmada\.$/, "")
      const confirmedDate = state.bookedDate ?? bookingDate
      setCheckMessage(state.message)
      setCheckOk(true)
      setLoginOpen(false)
      setConfirmedBooking({
        date: confirmedDate,
        slotId: scheduleSlotId,
        userName: confirmedName,
      })
      void loadDayAvailabilityAction(confirmedDate).then(setDayBooked)
      onBooked?.()
    }
    if (state.error) {
      setCheckMessage(state.error)
      setCheckOk(false)
    }
  }, [state, bookingDate, scheduleSlotId, onBooked])

  useEffect(() => {
    if (sessionUser == null || !scheduleSlotId || !bookingDate) {
      setCheckMessage(null)
      setCheckOk(null)
      setWillBeCharged(null)
      setTrialAvailable(false)
      setUseTrialClass(false)
      setActivePlan(null)
      setSuggestedPlans([])
      return
    }
    if (isCurrentBookingConfirmed) {
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      checkPublicBookingEligibility(scheduleSlotId, bookingDate).then((res) => {
        if (cancelled) return
        setWillBeCharged(res.ok ? (res.willBeCharged ?? null) : null)
        setActivePlan(res.ok ? (res.activePlan ?? null) : null)
        setSuggestedPlans(res.ok ? (res.suggestedPlans ?? []) : [])
        // La clase muestra viene marcada por defecto: es gratis y de una sola vez.
        const trial = res.ok && res.trialAvailable === true
        setTrialAvailable(trial)
        setUseTrialClass(trial)
        setCheckOk(res.ok)
        setCheckMessage(
          res.ok
            ? res.alumnaName
              ? t("booking.canBookName", { name: res.alumnaName })
              : t("booking.available")
            : (res.message ?? t("booking.unavailable")),
        )
      })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [sessionUser, scheduleSlotId, bookingDate, isCurrentBookingConfirmed])

  function submitBooking() {
    if (isCurrentBookingConfirmed) return
    if (bookingDate === "" || scheduleSlotId === "") return
    const fd = new FormData()
    fd.set("bookingDate", bookingDate)
    fd.set("scheduleSlotId", scheduleSlotId)
    if (trialAvailable && useTrialClass) {
      fd.set("useTrialClass", "true")
    }
    // useActionState exige transición cuando no se invoca desde `action`.
    startTransition(() => {
      formAction(fd)
    })
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginPending(true)

    const signIn = await signInByDisplayId(loginDisplayId, loginPassword)

    if (!signIn.ok) {
      setLoginPending(false)
      setLoginError(signIn.error)
      return
    }

    const user = await waitForSessionUser()
    if (user == null) {
      setLoginPending(false)
      setLoginError(t("booking.connectionError"))
      return
    }

    const enabled = (user as { enabled?: boolean }).enabled
    if (enabled === false) {
      await authClient.signOut()
      setLoginPending(false)
      setLoginError(t("booking.accountDisabled"))
      return
    }

    setLoginPending(false)
    setLoginOpen(false)
    setLoginDisplayId("")
    setLoginPassword("")
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 400)
    })
    submitBooking()
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isCurrentBookingConfirmed) return
    if (sessionUser == null) {
      setLoginOpen(true)
      return
    }
    void submitBooking()
  }

  return (
    <>
      <DbActionSuccessEffect success={state.success} kind="create" />
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {sessionUser != null ? (
          <div className="rounded-md border border-green-base/20 bg-green-base/5 px-4 py-3 text-sm">
            <p className="font-medium">{sessionUser.name}</p>
            {sessionDisplayId != null && sessionDisplayId !== "" ? (
              <p className="text-black/60 font-mono text-xs">{sessionDisplayId}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-black/60">
            {t("agendar.booking.modal.text001")}</p>
        )}
        <div className="space-y-2">
          <Label htmlFor="bookingDate">{t("agendar.booking.modal.text002")}</Label>
          <Input
            id="bookingDate"
            name="bookingDate"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduleSlotId">{t("agendar.booking.modal.text003")}</Label>
          {bookingDate === "" ? (
            <p className="text-sm text-black/60">{t("agendar.booking.modal.text004")}</p>
          ) : slotsForDay.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-black/60">
                {dayOfWeek === 0
                  ? t("booking.noSundayClasses")
                  : t("booking.noClassesThatDay")}
              </p>
              {canUseNextDate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-green-base/40 bg-white text-green-base hover:bg-green-base/10 hover:text-green-hover"
                  onClick={() => setBookingDate(nextDate)}
                >
                  {t("agendar.booking.modal.text005")}{formatBookingDateEs(nextDate)}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1">
              <select
                id="scheduleSlotId"
                name="scheduleSlotId"
                value={scheduleSlotId}
                onChange={(e) => setScheduleSlotId(e.target.value)}
                required
                disabled={loadingDay}
                className="flex h-10 w-full rounded-inner border border-black/10 bg-white px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">
                  {loadingDay ? t("booking.checkingPlaces") : t("booking.chooseClassTime")}
                </option>
                {loadingDay
                  ? null
                  : slotsForDay.map((slot) => (
                      <option key={slot.id} value={slot.id} disabled={slot.free <= 0}>
                        {formatSlotLabel(slot)}
                        {slot.free <= 0
                          ? t("booking.fullSuffix")
                          : t(slot.free === 1 ? "booking.onePlaceSuffix" : "booking.placesSuffix", { count: slot.free })}
                      </option>
                    ))}
              </select>
              {loadingDay ? (
                <p className="text-xs text-black/50">{t("agendar.booking.modal.text006")}</p>
              ) : null}
            </div>
          )}
        </div>
        {isCurrentBookingConfirmed ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-[#1b1a18]">
                {confirmedBooking?.userName ?? sessionUser?.name ?? t("booking.yourName")}
              </span>
              <span className="text-green-700">{t("agendar.booking.modal.text007")}</span>
            </p>
            {state.trialRedeemed ? (
              <div className="rounded-inner border border-green-base/30 bg-green-base/5 px-4 py-3 text-sm">
                <p>
                  {t("agendar.booking.modal.text008")}<span className="font-semibold">{t("agendar.booking.modal.text009")}</span>{t("agendar.booking.modal.text010")}</p>
              </div>
            ) : state.chargeFailed === true ? (
              <div className="rounded-inner border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p>
                  Tu lugar quedó apartado. El estudio te confirmará el importe de
                  la clase, porque todavía no hay un precio de clase individual
                  configurado.
                </p>
              </div>
            ) : state.pendingAmount != null ? (
              <div className="rounded-inner border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p>
                  {t("agendar.booking.modal.text011")}{" "}
                  <span className="font-semibold">{formatMxn(state.pendingAmount)}</span>{t("agendar.booking.modal.text012")}</p>
              </div>
            ) : null}
          </div>
        ) : activePlan != null && sessionUser != null && scheduleSlotId !== "" ? (
          <div className="space-y-1 rounded-inner border border-green-base/30 bg-green-base/5 px-4 py-3 text-sm">
            <p className="font-medium text-green-base">{t("booking.planActiveTitle")}</p>
            <p className="font-semibold text-[#1b1a18]">{activePlan.name}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/60">
              <span>
                {activePlan.daysLeft === 0
                  ? t("booking.planExpiresToday", { date: formatPlanDate(activePlan.endDate) })
                  : activePlan.daysLeft === 1
                    ? t("booking.planExpiresTomorrow", { date: formatPlanDate(activePlan.endDate) })
                    : t("booking.planExpiresIn", {
                        days: activePlan.daysLeft,
                        date: formatPlanDate(activePlan.endDate),
                      })}
              </span>
              <span aria-hidden>·</span>
              <span>
                {activePlan.classesRemaining != null
                  ? activePlan.classesRemaining === 1
                    ? t("booking.planOneClassLeft")
                    : t("booking.planClassesLeft", { count: activePlan.classesRemaining })
                  : activePlan.isUnlimited
                    ? t("booking.planUnlimited")
                    : activePlan.daysPerWeek != null
                      ? t("booking.planDaysPerWeek", { count: activePlan.daysPerWeek })
                      : t("booking.planActive")}
              </span>
            </div>
            {/* Barra de vigencia: 30 días es el ciclo típico del estudio. */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-green-base/15">
              <div
                className="h-full rounded-full bg-green-base transition-all"
                style={{
                  width: `${Math.max(4, Math.min(100, (activePlan.daysLeft / activePlan.totalDays) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : willBeCharged != null && sessionUser != null && scheduleSlotId !== "" ? (
          <div className="space-y-3 rounded-inner border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">{t("agendar.booking.modal.text013")}</p>
            {trialAvailable ? (
              <>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setUseTrialClass(true)}
                    className={`w-full rounded-inner border px-3 py-2 text-left transition-colors ${
                      useTrialClass
                        ? "border-green-base bg-white"
                        : "border-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <span className="block font-medium">{t("agendar.booking.modal.text014")}</span>
                    <span className="block text-xs text-black/60">
                      {t("agendar.booking.modal.text015")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseTrialClass(false)}
                    className={`w-full rounded-inner border px-3 py-2 text-left transition-colors ${
                      !useTrialClass
                        ? "border-green-base bg-white"
                        : "border-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <span className="block font-medium">{t("agendar.booking.modal.text016")}</span>
                    <span className="block text-xs text-black/60">
                      {formatMxn(willBeCharged.priceMxn)} {t("agendar.booking.modal.text017")}</span>
                  </button>
                </div>
                <p className="text-xs">
                  {useTrialClass
                    ? t("booking.trialReservedFree")
                    : t("booking.debtRegistered", { amount: formatMxn(willBeCharged.priceMxn) })}
                </p>
              </>
            ) : (
              <p>
                {t("agendar.booking.modal.text018")}{" "}
                <span className="font-semibold">{formatMxn(willBeCharged.priceMxn)}</span>{t("agendar.booking.modal.text019")}</p>
            )}
            {suggestedPlans.length > 0 ? (
              <div className="space-y-2 border-t border-amber-200 pt-3">
                <p className="font-medium">{t("booking.planSuggestTitle")}</p>
                <p className="text-xs">{t("booking.planSuggestBody")}</p>
                <ul className="space-y-1">
                  {suggestedPlans.map((plan) => (
                    <li
                      key={plan.id}
                      className="flex items-center justify-between gap-3 rounded-inner bg-white/70 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-[#1b1a18]">{plan.name}</span>
                      <span className="shrink-0 font-semibold text-green-base">
                        {formatMxn(plan.priceMxn)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/#planes"
                  className="inline-flex rounded-full bg-green-base px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-hover"
                >
                  {t("booking.planSuggestCta")}
                </Link>
              </div>
            ) : null}
          </div>
        ) : checkMessage ? (
          <p className={`text-sm ${checkOk ? "text-green-700" : "text-red-600"}`}>
            {checkMessage}
          </p>
        ) : null}
        {!isCurrentBookingConfirmed && !canSubmit && bookingDate !== "" && slotsForDay.length === 0 ? null : !isCurrentBookingConfirmed && !canSubmit ? (
          <p className="text-sm text-black/60">{t("agendar.booking.modal.text020")}</p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            className="w-full gap-2 bg-green-base hover:bg-green-hover"
            disabled={
              isCurrentBookingConfirmed ||
              pending ||
              !canSubmit ||
              (sessionUser != null && checkOk === false)
            }
          >
            {isCurrentBookingConfirmed ? (
              <>
                <CircleCheck className="h-4 w-4" />
                {t("agendar.booking.modal.text021")}</>
            ) : pending ? (
              "Guardando..."
            ) : (
              t("booking.confirm")
            )}
          </Button>
          {isCurrentBookingConfirmed ? (
            <Button
              type="button"
              variant="outline"
              className="w-full border-green-base/40 bg-white text-green-base hover:bg-green-base/10 hover:text-green-hover"
              onClick={props.onClose}
            >
              {t("agendar.booking.modal.text022")}</Button>
          ) : null}
        </div>
      </form>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("agendar.booking.modal.text023")}</DialogTitle>
            <DialogDescription>
              {t("agendar.booking.modal.text024")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="agendar-login-displayId">{t("agendar.booking.modal.text025")}</Label>
              <Input
                id="agendar-login-displayId"
                type="text"
                autoComplete="username"
                value={loginDisplayId}
                onChange={(e) => setLoginDisplayId(e.target.value.toUpperCase())}
                required
                disabled={loginPending}
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agendar-login-password">{t("agendar.booking.modal.text026")}</Label>
              <div className="relative">
                <Input
                  id="agendar-login-password"
                  type={loginPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                  className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={loginPasswordVisible ? t("booking.hidePassword") : t("booking.showPassword")}
                  disabled={loginPending}
                >
                  {loginPasswordVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-green-base hover:bg-green-hover" disabled={loginPending}>
              {loginPending ? t("booking.loggingIn") : t("booking.loginAndConfirm")}
            </Button>
            <p className="text-center text-xs text-black/60">
              {t("agendar.booking.modal.text027")}{" "}
              <Link href={routes.registry} className="text-green-base underline underline-offset-4">
                {t("agendar.booking.modal.text028")}</Link>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AgendarBookingModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string | null
  initialSlotId?: string | null
  onBooked?: () => void
}) {
  const { t } = useTranslation()
  const [data, setData] = useState<AgendarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!props.open) return
    if (data != null) return
    setLoading(true)
    setLoadError(null)
    loadAgendarDataAction()
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(t("booking.scheduleLoadError"))
        setLoading(false)
      })
  }, [props.open, data, t])

  function handleClose() {
    props.onOpenChange(false)
  }

  const formKey = `${props.initialDate ?? ""}-${props.initialSlotId ?? ""}-${props.open ? "1" : "0"}`

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("agendar.booking.modal.text029")}</DialogTitle>
          <DialogDescription>
            {t("agendar.booking.modal.text030")}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-black/60">{t("agendar.booking.modal.text031")}</p>
        ) : loadError ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-red-600">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-green-base/40 bg-white text-green-base hover:bg-green-base/10 hover:text-green-hover"
              onClick={() => {
                setData(null)
                setLoadError(null)
              }}
            >
              {t("agendar.booking.modal.text032")}</Button>
          </div>
        ) : data != null ? (
          <AgendarBookingForm
            key={formKey}
            slots={data.slots}
            defaultDate={data.defaultDate}
            todayStr={data.todayStr}
            disabledSlotDateKeys={data.disabledSlotDateKeys}
            bookedBySlotDate={data.bookedBySlotDate}
            initialDate={props.initialDate ?? undefined}
            initialSlotId={props.initialSlotId ?? undefined}
            onClose={handleClose}
            onBooked={props.onBooked}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
