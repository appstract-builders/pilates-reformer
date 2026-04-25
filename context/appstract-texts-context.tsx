"use client";

import { createContext, useEffect, useState } from "react";

type AppstractTextsContextValue = {
  texts: Record<string, string>;
  getText: (key: string) => string;
};

export const AppstractTextsContext = createContext<AppstractTextsContextValue>({
  texts: {} as Record<string, string>,
  getText: () => "",
});

export function AppstractTextsProvider({
  children,
  initialTexts = {},
}: {
  children: React.ReactNode;
  initialTexts?: Record<string, string>;
}) {
  const [texts, setTexts] = useState<Record<string, string>>(initialTexts);

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

  const getText = (key: string) => {
    const v = texts[key];
    if (typeof v === "string" && v.length > 0) {
      return v;
    }
    return "";
  };

  return <AppstractTextsContext.Provider value={{ texts, getText }}>{children}</AppstractTextsContext.Provider>;
}
