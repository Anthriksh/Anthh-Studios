import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import {
  isSupabaseConfigured,
  readAnalytics,
} from "../../../lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json([]);
    }

    const rows = await readAnalytics(5000);

    const events = rows.map((row) => ({
      id: row.id,

      sessionId:
        row.session_id || "",

      path:
        row.path || "/",

      referrer:
        row.referrer || "",

      device:
        row.device || "unknown",

      screen:
        row.screen || "",

      language:
        row.language || "",

      visitor:
        row.visitor || "",

      at:
        row.created_at,

      eventType:
        row.event_type || "page_view",
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error(
      "Admin analytics error:",
      error
    );

    return NextResponse.json(
      { error: "Analytics unavailable." },
      { status: 500 }
    );
  }
}