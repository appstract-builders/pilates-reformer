"use client";

import { createContext, useEffect, useState } from "react";

export const AppstractTextsContext = createContext({
  texts: {} as Record<string, string>,
  getText: (key: string, fallback: string) => fallback,
});

export function AppstractTextsProvider({ children }: { children: React.ReactNode }) {
  const [texts, setTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/central-texts")
      .then((r) => r.json())
      .then((body: { texts?: Record<string, string> }) => {
        if (body && body.texts && typeof body.texts === "object") {
          setTexts(body.texts);
        }
      })
      .catch(() => {});
  }, []);

  const getText = (key: string, fallback: string) => {
    const v = texts[key];
    if (typeof v === "string" && v.length > 0) {
      return v;
    }
    return fallback;
  };

  return <AppstractTextsContext.Provider value={{ texts, getText }}>{children}</AppstractTextsContext.Provider>;
}
