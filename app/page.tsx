import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { loadReservacionesPlans } from "@/lib/site/public-plans.server"
import { HomePage } from "./home-page"

export default async function Page() {
  const [plans, session] = await Promise.all([
    loadReservacionesPlans(),
    auth.api.getSession({
      headers: await headers(),
      query: { disableRefresh: true },
    }),
  ])

  return <HomePage plans={plans} loggedIn={session?.user != null} />
}
