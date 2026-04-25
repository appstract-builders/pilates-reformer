"use client";

import { motion } from "framer-motion";
import { useContext } from "react";
import { FaClock, FaHeart, FaMoon, FaSun } from "react-icons/fa6";
import { AppstractTextsContext } from "@/context/appstract-texts-context";

const morningSlots = [
  "home.schedule_morning_one",
  "home.schedule_morning_two",
  "home.schedule_morning_three",
  "home.schedule_morning_four",
];

const eveningSlots = [
  "home.schedule_evening_one",
  "home.schedule_evening_two",
  "home.schedule_evening_three",
  "home.schedule_evening_four",
];

const toSectionId = (label: string) => {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function ContentDetail() {
  const { getText } = useContext(AppstractTextsContext);
  const scheduleSectionId = toSectionId(getText("navbar.index_two"));
  const plansHref = `#${toSectionId(getText("navbar.index_one"))}`;
  const agendaHref = `#${toSectionId(getText("navbar.index_three"))}`;

  return (
    <section
      id={scheduleSectionId || undefined}
      className="relative isolate scroll-mt-40 overflow-hidden bg-slate-100/60 p-6 rounded-2xl shadow-lg"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,107,95,0.12),transparent_55%)]" />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-4xl border border-black/10 bg-[#d8cfc2] shadow-[0_25px_50px_rgba(27,26,24,0.15)]"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/horarios-pilates.jpg')" }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FaHeart className="text-[#2f6b5f]" />
              {getText("home.schedule_badge")}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                {getText("home.schedule_image_eyebrow")}
              </p>
              <p className="mt-2 text-2xl font-semibold font-display">
                {getText("home.schedule_image_title")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="flex flex-col gap-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1d4d44]">
              {getText("home.schedule_eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight font-display">
              {getText("home.schedule_title")}
            </h2>
            <p className="mt-2 text-sm text-black/60">
              {getText("home.schedule_description")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d4d44]">
                <FaSun />
                {getText("home.schedule_morning_title")}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-black/70">
                {morningSlots.map((slot) => (
                  <li
                    key={slot}
                    className="rounded-full border border-black/5 bg-[#f6f1ea]/70 px-3 py-2 text-center"
                  >
                    {getText(slot)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d4d44]">
                <FaMoon />
                {getText("home.schedule_evening_title")}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-black/70">
                {eveningSlots.map((slot) => (
                  <li
                    key={slot}
                    className="rounded-full border border-black/5 bg-[#f6f1ea]/70 px-3 py-2 text-center"
                  >
                    {getText(slot)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-black/70">
            <FaClock className="text-[#2f6b5f]" />
            <span>{getText("home.schedule_note")}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={agendaHref}
              className="rounded-full bg-[#1d4d44] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1d4d44]/20 transition hover:-translate-y-0.5"
            >
              {getText("home.schedule_button_agenda")}
            </a>
            <a
              href={plansHref}
              className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-black/70 transition hover:border-black/20"
            >
              {getText("home.schedule_button_plans")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
