import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  insertAnalytics,
  isSupabaseConfigured,
} from "../../lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hash(value) {
  return crypto
    .createHash("sha256")
    .update(value || "")
    .digest("hex")
    .slice(0, 12);
}

export async function POST(request) {
  try {
    const body = await request
      .json()
      .catch(() => ({}));

    const event = {
      event_type: "page_view",

      session_id: String(
        body.sessionId || ""
      ).slice(0, 80),

      path: String(
        body.path || "/"
      ).slice(0, 200),

      referrer: String(
        body.referrer || ""
      ).slice(0, 300),

      device: String(
        body.device || "unknown"
      ).slice(0, 40),

      screen: String(
        body.screen || ""
      ).slice(0, 40),

      language: String(
        body.language || ""
      ).slice(0, 40),

      visitor: hash(
        `${request.headers.get("user-agent") || ""}|${request.headers.get("accept-language") || ""}`
      ),

      user_agent: String(
        request.headers.get("user-agent") || ""
      ).slice(0, 1000),
    };

    if (isSupabaseConfigured()) {
      await insertAnalytics(event);

      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Analytics error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
      },
      { status: 500 }
    );
  }
}