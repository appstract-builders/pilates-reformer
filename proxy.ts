import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next 16 reemplazó la convención `middleware` por `proxy`; el handler debe
 * llamarse `proxy` o el archivo no se ejecuta.
 *
 * `x-dashboard-pathname` lo lee app/dashboard/layout.tsx para decidir si el rol
 * tiene permiso sobre la ruta: si deja de llegar, el guard usa la ruta por
 * defecto y redirige mal.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-dashboard-pathname", request.nextUrl.pathname)
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
}
