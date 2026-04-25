import { NextResponse } from "next/server";

export async function GET() {
  const origin = process.env.APPSTRACT_ORIGIN ?? "http://localhost:3000";
  const secret = process.env.APPSTRACT_PROJECT_READ_SECRET ?? "";
  const slug = process.env.APPSTRACT_PROJECT_SLUG ?? "pilates-reformer";
  if (!secret) {
    return NextResponse.json({ texts: {} });
  }
  const upstream = await fetch(
    `${origin}/api/public/project-texts?slug=${encodeURIComponent(slug)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    },
  );
  if (!upstream.ok) {
    return NextResponse.json({ texts: {} });
  }
  const data = (await upstream.json()) as { texts?: Record<string, string> };
  const texts = data.texts && typeof data.texts === "object" ? data.texts : {};
  return NextResponse.json({ texts });
}
