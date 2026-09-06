"use client"

import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

/**
 * Sin este boundary, cualquier error de render en el cliente deja la pantalla
 * en blanco y sin rastro: el usuario no sabe qué pasó y nosotros tampoco. Aquí
 * al menos queda el mensaje en consola y una salida para el usuario.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] error no controlado:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center font-sans">
      <TriangleAlert className="h-12 w-12 text-amber-500" aria-hidden />
      <h1 className="text-xl font-semibold text-neutral-900">
        Algo salió mal al cargar esta pantalla
      </h1>
      <p className="max-w-md text-sm text-neutral-500">
        Vuelve a intentarlo. Si sigue ocurriendo, avisa al estudio con el código de
        abajo para poder rastrearlo.
      </p>
      {error.digest ? (
        <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
          {error.digest}
        </code>
      ) : null}
      <Button onClick={reset}>Reintentar</Button>
    </div>
  )
}
