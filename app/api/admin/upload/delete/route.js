import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import {
  deleteStorageObject,
  isSupabaseConfigured,
} from "../../../../lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const storagePath = String(
      body?.storagePath || ""
    ).trim();

    if (
      !storagePath ||
      !storagePath.startsWith("media/")
    ) {
      return NextResponse.json(
        { error: "Invalid storage path." },
        { status: 400 }
      );
    }

    await deleteStorageObject(storagePath);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Storage delete error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not delete file.",
      },
      { status: 500 }
    );
  }
}