import "server-only"

import { getHydratedResources } from "@/lib/hydrate/texts"
import type { TextOptions } from "@/lib/hydrate/types"
import { interpolateText, lookupText } from "./translate"

export async function getServerT() {
  const resources = await getHydratedResources()
  return (key: string, options?: TextOptions) => {
    const value = lookupText(resources, key)
    return value === undefined ? "" : interpolateText(value, options)
  }
}
