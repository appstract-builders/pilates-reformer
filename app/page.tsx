"use client";

import { AnimatePresence, motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventInput } from "@fullcalendar/core";
import { useEffect, useMemo, useState } from "react";
import ContentDetail from "@/components/content-detail";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cadenceOptions = ["Semanal", "Quincenal", "Mensual"];

const studioPlans = [
  {
    name: "Plan Equilibrio",
    frequency: "3 clases por semana",
    schedule: "Lunes, Miércoles y Viernes · Martes, Jueves y Sábado",
    prices: {
      Semanal: "$400",
      Quincenal: "$700",
      Mensual: "$1350",
    },
    image: "/equilibrio.jpg",
  },
  {
    name: "Plan Vitalidad",
    frequency: "5 clases por semana",
    schedule: "Lunes a Viernes",
    prices: {
      Semanal: "$650",
      Quincenal: "$1150",
      Mensual: "$2200",
    },
    image: "/vitalidad.jpg",
  },
];

const stats = [
  { label: "Clientes activos", value: "128" },
  { label: "Ocupación semanal", value: "87%" },
  { label: "Cobros al día", value: "98%" },
];

const flow = [
  {
    title: "Configura planes y cupos",
    description:
      "Define sesiones, límite de reservas y reglas de reprogramación por plan.",
  },
  {
    title: "Automatiza cobros",
    description:
      "Mensualidades recurrentes, facturas y recordatorios en un solo lugar.",
  },
  {
    title: "Agenda inteligente",
    description:
      "El cliente reserva en tiempo real y recibe confirmación inmediata.",
  },
  {
    title: "Seguimiento continuo",
    description:
      "Notas por clase, evolución y renovación automática de planes.",
  },
];

export default function Home() {
  const [navSolid, setNavSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DateSelectArg | null>(null);
  const [reservationName, setReservationName] = useState("");
  const [reservationPlan, setReservationPlan] = useState("Semanal");

  const initialEvents = useMemo<EventInput[]>(() => {
    const addDays = (days: number, hour: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(hour, 0, 0, 0);
      return date;
    };

    return [
      {
        id: "e1",
        title: "Reformer 1:1 · Sofia",
        start: addDays(1, 8),
        end: addDays(1, 9),
      },
      {
        id: "e2",
        title: "Reformer Duo · Laura",
        start: addDays(2, 10),
        end: addDays(2, 11),
      },
      {
        id: "e3",
        title: "Clase privada · Adri",
        start: addDays(3, 18),
        end: addDays(3, 19),
      },
      {
        id: "e4",
        title: "Evaluación inicial",
        start: addDays(4, 9),
        end: addDays(4, 10),
      },
    ];
  }, []);

  const [events, setEvents] = useState<EventInput[]>(initialEvents);

  useEffect(() => {
    const handleScroll = () => {
      setNavSolid(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleMediaChange = () => setIsMobile(media.matches);
    handleMediaChange();
    media.addEventListener("change", handleMediaChange);
    return () => media.removeEventListener("change", handleMediaChange);
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedSlot(selectInfo);
  };

  const navLinks = [
    { href: "#planes", label: "Planes" },
    { href: "#horarios", label: "Horarios" },
    { href: "#agenda", label: "Agenda" },
    { href: "#cobros", label: "Cobros" },
    { href: "#contacto", label: "Contacto" },
  ];

  const handleReserve = () => {
    if (!selectedSlot) return;
    const title = reservationName
      ? `Reserva · ${reservationName}`
      : `Reserva · ${reservationPlan}`;

    setEvents((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        title,
        start: selectedSlot.start,
        end: selectedSlot.end,
      },
    ]);

    setSelectedSlot(null);
    setReservationName("");
  };

  return (
    <div
      id="top"
      className="relative min-h-screen overflow-hidden bg-[#f6f1ea] text-[#1b1a18]"
    >
      <div className="pointer-events-none absolute -left-20 top-40 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(47,107,95,0.25),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[-60px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(47,79,79,0.35),transparent_70%)] blur-3xl animate-float" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(255,215,186,0.5),transparent_70%)] blur-3xl" />

      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed left-1/2 top-3 z-50 w-[min(92vw,1180px)] -translate-x-1/2 rounded-full border pl-3 pr-4 py-2 backdrop-blur transition ${
          navSolid
            ? "border-black/10 bg-white/90 text-[#1b1a18] shadow-[0_12px_30px_rgba(27,26,24,0.12)]"
            : "border-white/20 bg-white/10 text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <a
              href="#top"
              className={`grid h-14 w-14 place-items-center overflow-hidden rounded-full border ring-1 ${
                navSolid
                  ? "border-black/10 bg-white/80 ring-black/10"
                  : "border-white/30 bg-white/15 ring-white/30"
              }`}
            >
              <Image
                src="/pilates-reformer.jpg"
                alt="Pilates Reformer"
                width={50}
                height={50}
                className="h-full w-full object-cover"
                priority
              />
            </a>
            <div>
              <p className="text-sm font-semibold tracking-wide">
                Pilates Reformer Studio
              </p>
              <p
                className={`text-xs ${
                  navSolid ? "text-black/60" : "text-white/70"
                }`}
              >
                Planes · Cobros · Reservas
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-[#2f6b5f]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                navSolid
                  ? "bg-[#1d4d44] text-white hover:bg-[#163a33]"
                  : "bg-white text-[#1b1a18] hover:bg-white/90"
              }`}
            >
              Continuar
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${
              navSolid
                ? "border-black/10 bg-white/90 text-[#1b1a18]"
                : "border-white/30 bg-white/10 text-white"
            }`}
          >
            <span className="relative block h-4 w-4">
              <span
                className={`absolute left-0 top-0 h-0.5 w-full rounded-full transition ${
                  menuOpen ? "translate-y-1.5 rotate-45" : ""
                } ${navSolid ? "bg-[#1b1a18]" : "bg-white"}`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full transition ${
                  menuOpen ? "opacity-0" : ""
                } ${navSolid ? "bg-[#1b1a18]" : "bg-white"}`}
              />
              <span
                className={`absolute left-0 top-3 h-0.5 w-full rounded-full transition ${
                  menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                } ${navSolid ? "bg-[#1b1a18]" : "bg-white"}`}
              />
            </span>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute right-4 top-24 max-h-[calc(100vh-7rem)] w-[min(85vw,320px)] overflow-y-auto rounded-3xl border border-black/10 bg-white/95 p-6 shadow-[0_25px_60px_rgba(27,26,24,0.2)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                    Menú
                  </p>
                  <p className="text-lg font-semibold">Pilates Reformer</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex flex-col gap-3 text-sm font-semibold text-[#1b1a18]">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-black/5 bg-[#f6f1ea] px-4 py-3 transition hover:bg-[#eae1d6]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <button className="mt-5 w-full rounded-full bg-[#1d4d44] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163a33]">
                Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-[#1b1a18] bg-center bg-cover"
          style={{ backgroundImage: "url('/pilates-estilo.jpg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/45 to-[#f6f1ea]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-10 px-6 pb-20 pt-32 text-white sm:pt-36 lg:min-h-[82vh] lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-32">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-8 my-30"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70"
            >
              Sistema integral de membresías
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-semibold leading-tight text-balance md:text-5xl lg:text-6xl font-display"
            >
              Organiza tu estudio, tus planes y cada reserva desde un solo
              panel.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg leading-relaxed text-white/80"
            >
              Construye una experiencia premium con planes semanales,
              quincenales y mensuales. Automatiza cobros y permite que tus
              clientes reserven en segundos.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a
                href="#planes"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1b1a18] shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
              >
                Ver planes
              </a>
              <a
                href="#agenda"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/70"
              >
                Reservar ahora
              </a>
            </motion.div>
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {stats.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-center shadow-sm"
                >
                  <p className="text-2xl font-semibold text-white">
                    {item.value}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-white/60">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col gap-6 rounded-[32px] border border-white/15 bg-white/10 p-8 text-white shadow-[0_25px_60px_rgba(27,26,24,0.18)] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Inicio rápido
                </p>
                <h2 className="text-2xl font-semibold font-display">
                  Continuar configuración
                </h2>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-semibold">
                02
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-white/80">
                Siguiente paso recomendado
              </p>
              <p className="text-xl font-semibold text-white">
                Define horarios y capacidad
              </p>
              <p className="text-sm text-white/70">
                Elige cuántas sesiones puede reservar cada plan y bloquea los
                turnos del staff.
              </p>
            </div>
            <div className="grid gap-3">
              {flow.slice(0, 2).map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2f6b5f]" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-white/70">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1b1a18] shadow-lg shadow-black/30 transition hover:-translate-y-0.5">
              Continuar
            </button>
          </motion.div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24">
        <section id="planes" className="scroll-mt-40">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col gap-10"
          >
            <motion.div variants={fadeUp} className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1d4d44]">
                Planes Studio 57
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl font-display">
                Elige tu frecuencia de práctica
              </h2>
              <p className="mt-3 text-base text-black/70">
                Aparte de las frecuencias de cobro, estos son los planes que
                puedes ofrecer en el estudio con sus precios por modalidad.
              </p>
            </motion.div>

            <div className="grid gap-8">
              {studioPlans.map((plan) => (
                <motion.article
                  key={plan.name}
                  variants={fadeUp}
                  className="grid gap-6 overflow-hidden rounded-[32px] border border-black/10 bg-white/90 shadow-[0_20px_40px_rgba(27,26,24,0.08)] lg:grid-cols-[1.05fr_0.95fr]"
                >
                  <div className="relative min-h-[240px]">
                    <div
                      className="absolute inset-0 bg-[#d8cfc2] bg-cover bg-center"
                      style={{ backgroundImage: `url('${plan.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-black/70">
                      Foto del estudio · reemplazar imagen
                    </div>
                  </div>
                  <div className="flex flex-col justify-between gap-6 p-6">
                    <div>
                      <h3 className="text-2xl font-semibold font-display">
                        {plan.name}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-[#1d4d44]">
                        {plan.frequency}
                      </p>
                      <p className="mt-1 text-sm text-black/60">
                        {plan.schedule}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {cadenceOptions.map((cadence) => (
                        <div
                          key={cadence}
                          className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#f6f1ea]/80 px-4 py-3"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                            {cadence}
                          </span>
                          <span className="text-lg font-semibold text-[#1d4d44]">
                            {plan.prices[cadence as keyof typeof plan.prices]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
                      {cadenceOptions.map((cadence) => (
                        <span
                          key={cadence}
                          className="rounded-full border border-black/10 bg-white px-3 py-1"
                        >
                          {cadence}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-black/10 bg-white/80 px-6 py-5 text-sm text-black/70 md:flex-row md:items-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/40">
                Precio por clase
              </p>
              <div className="text-2xl font-semibold text-[#1d4d44]">
                $140
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {cadenceOptions.map((cadence) => (
                  <span
                    key={cadence}
                    className="rounded-full bg-[#f6f1ea] px-3 py-1"
                  >
                    {cadence}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <ContentDetail />

        <section id="cobros" className="scroll-mt-40">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <motion.div variants={fadeUp} className="flex flex-col gap-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1d4d44]">
                Cobros y renovaciones
              </p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl font-display">
                Automatiza los ingresos y evita seguimiento manual.
              </h2>
              <p className="text-base text-black/70">
                Diseña políticas de reprogramación, pagos recurrentes y
                renovaciones automáticas. Todo conectado al calendario.
              </p>
              <div className="grid gap-4">
                {flow.map((item, index) => (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="flex items-start gap-5 rounded-2xl border border-black/5 bg-white/80 px-6 py-5"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1d4d44] text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-black/60">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex h-full flex-col justify-between rounded-[28px] border border-black/10 bg-white/90 p-6 shadow-[0_20px_40px_rgba(27,26,24,0.1)]"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                  Resumen mensual
                </p>
                <h3 className="mt-3 text-2xl font-semibold font-display">
                  Febrero · 2026
                </h3>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-black/5 bg-[#f6f1ea]/80 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                    Ingresos proyectados
                  </p>
                  <p className="text-2xl font-semibold text-[#1d4d44]">
                    $6,420
                  </p>
                  <p className="text-xs text-black/60">
                    24 membresías activas
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                    Cobros pendientes
                  </p>
                  <p className="text-2xl font-semibold text-[#2f6b5f]">
                    $380
                  </p>
                  <p className="text-xs text-black/60">
                    3 clientes por confirmar
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                    Renovaciones próximas
                  </p>
                  <p className="text-lg font-semibold">
                    9 miembros en 7 días
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/60">
                    <span className="rounded-full bg-[#f6f1ea] px-3 py-1">
                      Semanal · 4
                    </span>
                    <span className="rounded-full bg-[#f6f1ea] px-3 py-1">
                      Quincenal · 3
                    </span>
                    <span className="rounded-full bg-[#f6f1ea] px-3 py-1">
                      Mensual · 2
                    </span>
                  </div>
                </div>
              </div>
              <button className="mt-6 rounded-full bg-[#1d4d44] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1d4d44]/20 transition hover:-translate-y-0.5">
                Configurar cobros
              </button>
            </motion.div>
          </motion.div>
        </section>

        <section id="agenda" className="scroll-mt-40">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col gap-12"
          >
            <motion.div variants={fadeUp} className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1d4d44]">
                Agenda inteligente
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl font-display">
                Reservas en tiempo real para clientes y equipo.
              </h2>
              <p className="mt-3 text-base text-black/70">
                El calendario permite seleccionar horarios, bloquear cupos y
                mantener la disponibilidad siempre actualizada.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <motion.div
                variants={fadeUp}
                className="rounded-[24px] border border-black/10 bg-white/90 p-3 shadow-[0_20px_40px_rgba(27,26,24,0.08)] sm:rounded-[28px] sm:p-4"
              >
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={isMobile ? "dayGridMonth" : "timeGridWeek"}
                  height="auto"
                  headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: isMobile ? "" : "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  titleFormat={isMobile ? { month: "short", year: "numeric" } : undefined}
                  events={events}
                  nowIndicator
                  selectable
                  selectMirror
                  select={handleDateSelect}
                  dayMaxEvents
                  slotMinTime="06:00:00"
                  slotMaxTime="21:00:00"
                />
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex h-full flex-col justify-between gap-6 rounded-[24px] border border-black/10 bg-white/90 p-5 shadow-[0_20px_40px_rgba(27,26,24,0.08)] sm:rounded-[28px] sm:p-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                    Reserva rápida
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold font-display">
                    {selectedSlot
                      ? "Confirma la sesión"
                      : "Selecciona un horario"}
                  </h3>
                  <p className="mt-2 text-sm text-black/60">
                    {selectedSlot
                      ? `Inicio: ${selectedSlot.start.toLocaleString()}`
                      : "Elige un bloque en el calendario para reservar."}
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                    Cliente
                  </label>
                  <input
                    value={reservationName}
                    onChange={(event) => setReservationName(event.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
                  />
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                    Frecuencia
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    {cadenceOptions.map((plan) => (
                      <button
                        type="button"
                        key={plan}
                        onClick={() => setReservationPlan(plan)}
                        className={`rounded-full border px-3 py-2 transition ${
                          reservationPlan === plan
                            ? "border-[#1d4d44] bg-[#1d4d44] text-white"
                            : "border-black/10 bg-white text-black/70 hover:border-black/20"
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-black/15 bg-[#f6f1ea]/80 px-4 py-3 text-xs text-black/60">
                  {selectedSlot
                    ? "Reserva lista para confirmar. Se enviará recordatorio automático 24 h antes."
                    : "Selecciona un horario y confirma para bloquear la sesión en el calendario."}
                </div>

                <button
                  onClick={handleReserve}
                  disabled={!selectedSlot}
                  className="rounded-full bg-[#1d4d44] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1d4d44]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-black/20 disabled:shadow-none"
                >
                  Confirmar reserva
                </button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="contacto" className="scroll-mt-40">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-10 rounded-4xl border border-black/10 bg-white/90 p-10 shadow-[0_20px_40px_rgba(27,26,24,0.08)] lg:grid-cols-[1.2fr_0.8fr]"
          >
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1d4d44]">
                Lista para lanzar
              </p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl font-display">
                Construyamos tu panel de control a medida.
              </h2>
              <p className="text-base text-black/70">
                Esta base ya incluye planes, cobros y agenda. Podemos integrar
                pagos, mensajes y reportes avanzados según tu flujo.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
              <input
                placeholder="Nombre del estudio"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
              />
              <input
                placeholder="Correo de contacto"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
              />
              <textarea
                placeholder="Cuéntanos qué necesitas integrar"
                rows={4}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
              />
              <button className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5">
                Solicitar propuesta
              </button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d4d44] text-sm font-semibold text-white">
                PR
              </div>
              <div>
                <p className="text-sm font-semibold">Pilates Reformer Studio</p>
                <p className="text-xs text-black/60">
                  Planes · Cobros · Reservas
                </p>
              </div>
            </div>
            <p className="text-sm text-black/60">
              Una base elegante para gestionar membresías, control de pagos y
              reservas en tiempo real.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-black/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
              Explorar
            </p>
            <a href="#planes" className="transition hover:text-[#1d4d44]">
              Planes
            </a>
            <a href="#agenda" className="transition hover:text-[#1d4d44]">
              Agenda
            </a>
            <a href="#cobros" className="transition hover:text-[#1d4d44]">
              Cobros
            </a>
          </div>
          <div className="flex flex-col gap-3 text-sm text-black/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
              Contacto
            </p>
            <span>hola@pilatesreformer.com</span>
            <span>+52 55 1234 5678</span>
            <button className="mt-2 rounded-full bg-[#1d4d44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163a33]">
              Agendar demo
            </button>
          </div>
        </div>
        <div className="border-t border-black/5">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-black/50 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Pilates Reformer Studio. Todos los derechos reservados.</p>
            <div className="flex flex-wrap gap-4">
              <span>Políticas</span>
              <span>Privacidad</span>
              <span>Soporte</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
