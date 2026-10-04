import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 200 * 1024 * 1024;

const allowed = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["audio/mpeg", ".mp3"],
  ["audio/wav", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/ogg", ".ogg"],
  ["audio/mp4", ".m4a"],
]);

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const originalName =
      typeof body?.name === "string"
        ? body.name
        : "";

    const type =
      typeof body?.type === "string"
        ? body.type
        : "";

    const size = Number(body?.size || 0);

    const ext = allowed.get(type);

    if (!originalName || !type || !ext) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${type || "unknown"}`,
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json(
        { error: "Invalid file size." },
        { status: 400 }
      );
    }

    if (size > MAX) {
      return NextResponse.json(
        {
          error: "File too large. Maximum is 200 MB.",
        },
        { status: 400 }
      );
    }

    const storagePath =
      `media/${crypto.randomUUID()}${ext}`;

    const supabase = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data,
      error,
    } = await supabase.storage
      .from("anthh-media")
      .createSignedUploadUrl(
        storagePath,
        {
          upsert: false,
        }
      );

    if (error) {
      throw error;
    }

    if (!data?.token || !data?.path) {
      throw new Error(
        "Supabase did not return a signed upload token."
      );
    }

    const kind =
      type.startsWith("image/")
        ? "IMAGE"
        : type.startsWith("video/")
          ? "VIDEO"
          : "AUDIO";

    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/anthh-media/${storagePath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

    return NextResponse.json({
      ok: true,
      path: data.path,
      token: data.token,
      url: publicUrl,
      storagePath,
      name: originalName,
      type,
      kind,
    });
  } catch (error) {
    console.error(
      "Upload preparation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Upload preparation failed.",
      },
      { status: 500 }
    );
  }
}