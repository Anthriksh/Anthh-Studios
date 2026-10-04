import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin } from "../_auth";
import {
  isSupabaseConfigured,
  readLocalContentFallback,
  readSiteContent,
  writeSiteContent,
}  from "../../../lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localFile = path.join(process.cwd(), "data", "content.json");

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

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
    }

    return NextResponse.json(await readLocalContentFallback(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin content GET error:", error);

    return NextResponse.json(
      { error: "Content is unavailable." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const content = await request.json();

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Invalid content payload." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const saved = await writeSiteContent(content);

      return NextResponse.json(
        {
          ok: true,
          content: saved,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    await fs.writeFile(
      localFile,
      JSON.stringify(content, null, 2),
      "utf8"
    );

    return NextResponse.json({
      ok: true,
      content,
    });
  } catch (error) {
    console.error("Admin content PUT error:", error);

    return NextResponse.json(
      { error: "Could not save content." },
      { status: 500 }
    );
  }
}