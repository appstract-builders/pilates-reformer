import type { TextOptions, TextResources } from "@/lib/hydrate/types"

export function lookupText(resources: TextResources, key: string): string | undefined {
  let node: unknown = resources.es
  for (const segment of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined
    node = (node as Record<string, unknown>)[segment]
  }
  return typeof node === "string" ? node : undefined
}

export function interpolateText(value: string, options?: TextOptions): string {
  if (!options) return value
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const replacement = options[name]
    return replacement == null ? match : String(replacement)
  })
}
