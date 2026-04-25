import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import "./globals.css";
import { AppstractTextsProvider } from "@/context/appstract-texts-context";
import { getHydratedTexts } from "@/lib/db/texts";

const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pilates Reformer Studio",
  description:
    "Base para gestionar planes, cobros y reservas en un estudio de pilates reformer.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projectId = Number(process.env.IMIN_PROJECT_ID ?? "1") || 1;
  const initialTexts = getHydratedTexts(projectId);

  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${sora.variable} ${cormorant.variable} antialiased`}>
        <AppstractTextsProvider initialTexts={initialTexts}>{children}</AppstractTextsProvider>
      </body>
    </html>
  );
}
