import { NextResponse } from "next/server";
import { getHydratedTexts } from "@/lib/db/texts";

export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = Number(process.env.IMIN_PROJECT_ID ?? "1") || 1;
  const texts = getHydratedTexts(projectId);

  return NextResponse.json(
    { texts },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
