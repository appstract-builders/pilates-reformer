"use client"

import { createContext, useCallback, useContext } from "react"
import type { ReactNode } from "react"
import type { TextOptions, TextResources } from "@/lib/hydrate/types"
import { interpolateText, lookupText } from "./translate"

const TextContext = createContext<TextResources | null>(null)

export function TextProvider({ resources, children }: { resources: TextResources; children: ReactNode }) {
  return <TextContext.Provider value={resources}>{children}</TextContext.Provider>
}

export function useTranslation() {
  const resources = useContext(TextContext)
  if (!resources) throw new Error("useTranslation debe usarse dentro de <TextProvider>")
  const t = useCallback((key: string, options?: TextOptions) => {
    const value = lookupText(resources, key)
    return value === undefined ? key : interpolateText(value, options)
  }, [resources])
  return { t }
}
