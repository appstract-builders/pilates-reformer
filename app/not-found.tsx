import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaCalendarCheck } from "react-icons/fa";
import { GiWeightLiftingUp } from "react-icons/gi";
import { getServerT } from "@/lib/text/server-text";

const LOGO_SRC = `${process.env.NEXT_PUBLIC_S3}Studio57.jpeg`;

export default async function NotFound() {
  const t = await getServerT();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-clip bg-[#f9f0e3] px-6 text-center text-[#1b1a18]">
      {/* Decorative blobs, mismo lenguaje visual que el home */}
      <div className="pointer-events-none absolute -left-20 top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(47,107,95,0.25),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,215,186,0.5),transparent_70%)] blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-black/10 bg-white shadow-lg shadow-black/10">
          <Image
            src={LOGO_SRC}
            alt={t("notFound.logoAlt")}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>

        <div className="flex items-center gap-3 text-green-base">
          <GiWeightLiftingUp className="h-9 w-9" />
          <span className="font-display text-7xl font-bold leading-none sm:text-8xl">
            404
          </span>
        </div>

        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          {t("notFound.title")}
        </h1>
        <p className="max-w-md text-base text-black/70">
          {t("notFound.description")}
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-green-base px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-base/20 transition hover:-translate-y-0.5 hover:bg-green-hover"
          >
            <FaArrowLeft className="h-4 w-4" />
            {t("notFound.back")}
          </Link>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 rounded-full border border-green-base/30 bg-white/70 px-6 py-3 text-sm font-semibold text-green-base transition hover:bg-white"
          >
            <FaCalendarCheck className="h-4 w-4" />
            {t("notFound.book")}
          </Link>
        </div>
      </div>

      <p className="absolute bottom-6 z-10 text-xs text-black/40">
        {t("notFound.brand")}
      </p>
    </main>
  );
}
