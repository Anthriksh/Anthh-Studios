import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  readLocalContentFallback,
  readSiteContent,
} from "../../lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const content = await readSiteContent();

      if (content) {
        return NextResponse.json(content, {
          headers: {
            "Cache-Control": "no-store",
          },
        });
      }

      const fallback = await readLocalContentFallback();

      return NextResponse.json(fallback, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const content = await readLocalContentFallback();

    return NextResponse.json(content, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Content API error:", error);

    return NextResponse.json(
      { error: "Content is unavailable." },
      { status: 500 }
    );
  }
}