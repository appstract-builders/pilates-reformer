"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"
import { useTranslation } from "@/lib/text/text-provider"

/**
 * El CTA de la cabecera pública. Con sesión abierta manda a la cuenta en vez de
 * pedir un login que ya se hizo; `initialLoggedIn` viene del servidor para que
 * el texto no parpadee mientras el cliente resuelve la sesión.
 */
export function AccountNavLink(props: {
  className?: string
  initialLoggedIn?: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const { data, isPending } = authClient.useSession()
  const loggedIn = isPending ? (props.initialLoggedIn ?? false) : data?.user != null

  return (
    <Link
      href={loggedIn ? routes.dashboard : routes.login}
      className={props.className}
      onClick={props.onNavigate}
    >
      {loggedIn ? t("site.account.view") : t("site.account.login")}
    </Link>
  )
}
