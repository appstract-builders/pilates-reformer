import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import "./globals.css";
import { TextProvider } from "@/lib/text/text-provider";
import { getHydratedResources } from "@/lib/hydrate/texts";

const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const resources = await getHydratedResources();
  const title = resources.es?.meta && typeof (resources.es.meta as Record<string, unknown>).title === "string"
    ? (resources.es.meta as Record<string, string>).title
    : "";
  const description = resources.es?.meta && typeof (resources.es.meta as Record<string, unknown>).description === "string"
    ? (resources.es.meta as Record<string, string>).description
    : "";
  return {
  title,
  description,
  icons: {
    icon: [{ url: `${process.env.NEXT_PUBLIC_S3}Studio57.jpeg`, type: "image/jpeg" }],
    apple: [{ url: `${process.env.NEXT_PUBLIC_S3}Studio57.jpeg`, type: "image/jpeg" }],
  },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resources = await getHydratedResources();
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${sora.variable} ${cormorant.variable} antialiased`}>
        <TextProvider resources={resources}>{children}</TextProvider>
      </body>
    </html>
  );
}
