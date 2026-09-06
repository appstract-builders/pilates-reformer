"use client"

import Image from "next/image"
import Link from "next/link"
import { siteLogo } from "@/lib/site/routes"
import { cn } from "@/lib/utils"

export function DashboardBrand(props: {
  studioName: string
  logoUrl?: string | null
  subtitle?: string
  className?: string
  /** Cuando se pasa, la marca se vuelve enlace. El login y el alta no lo usan. */
  href?: string
}) {
  const logoSrc =
    props.logoUrl != null && props.logoUrl.trim() !== ""
      ? props.logoUrl.trim()
      : siteLogo
  const subtitle = props.subtitle ?? "Sistema de Reservas"

  const content = (
    <>
      <div
        className="relative h-12 w-12 shrink-0 rounded-full p-5 bg-white overflow-hidden"
        style={{
          borderRadius: "9999px",
          flexShrink: 0,
          height: 48,
          overflow: "hidden",
          position: "relative",
          width: 48,
        }}
      >
        <Image
          src={logoSrc}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
          style={{ objectFit: "cover" }}
          unoptimized={logoSrc.startsWith("http")}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">{props.studioName}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </>
  )

  const classes = cn("flex items-center gap-3", props.className)

  if (props.href != null) {
    return (
      <Link
        href={props.href}
        className={cn(
          classes,
          "rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
