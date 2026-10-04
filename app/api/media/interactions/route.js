import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "anthh_device";
const MAX_COMMENT = 600;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not configured on the server.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

function visitorHash(request) {
  return crypto.createHash("sha256").update(`${request.headers.get("user-agent") || ""}|${request.headers.get("accept-language") || ""}`).digest("hex").slice(0, 16);
}

function mediaIdsFromContent(content) {
  return new Set((content?.media || []).map((item) => item?.id || item?.storagePath || item?.url || item?.name).filter(Boolean));
}

async function getPublishedMediaIds() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) return new Set();
  const res = await fetch(`${base}/rest/v1/site_content?id=eq.main&select=content&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!res.ok) throw new Error("Could not validate media.");
  const rows = await res.json();
  return mediaIdsFromContent(rows?.[0]?.content);
}

function deviceId(request) {
  return clean(request.cookies.get(COOKIE)?.value, 80);
}

function ensureDevice(response, current) {
  if (current) return current;
  const id = crypto.randomUUID();
  response.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return id;
}

export async function GET(request) {
  try {
    const supabase = getClient();
    const params = new URL(request.url).searchParams;
    const ids = [...new Set((params.get("mediaIds") || "").split(",").map((x) => decodeURIComponent(x).trim()).filter(Boolean))].slice(0, 40);
    if (!ids.length) return NextResponse.json({});

    const device = deviceId(request);
    const { data, error } = await supabase.from("media_interactions").select("id,media_id,interaction_type,session_id,display_name,comment,created_at,status").in("media_id", ids).eq("status", "approved").order("created_at", { ascending: false }).limit(5000);
    if (error) throw error;

    const result = {};
    for (const id of ids) result[id] = { likes: 0, shares: 0, liked: false, comments: [] };
    for (const row of data || []) {
      const bucket = result[row.media_id];
      if (!bucket) continue;
      if (row.interaction_type === "like") { bucket.likes += 1; if (device && row.session_id === device) bucket.liked = true; }
      if (row.interaction_type === "share") bucket.shares += 1;
      if (row.interaction_type === "comment" && row.comment) bucket.comments.push({ id: row.id, name: row.display_name || "Anonymous", comment: row.comment, at: row.created_at });
    }

    const response = NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    ensureDevice(response, device);
    return response;
  } catch (error) {
    console.error("Media interactions GET error:", error);
    return NextResponse.json({ error: "Interactions unavailable." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getClient();
    const body = await request.json().catch(() => ({}));
    const mediaId = clean(body.mediaId, 500);
    const type = clean(body.type, 20);
    const comment = clean(body.comment, MAX_COMMENT);
    const displayName = clean(body.displayName, 80);
    if (!mediaId || !["like", "comment", "share"].includes(type)) return NextResponse.json({ error: "Invalid interaction." }, { status: 400 });

    const validIds = await getPublishedMediaIds();
    if (!validIds.has(mediaId)) return NextResponse.json({ error: "Media item not found." }, { status: 404 });

    const currentDevice = deviceId(request);
    const response = NextResponse.json({ ok: true });
    const device = ensureDevice(response, currentDevice);

    if (type === "like") {
      const { error } = await supabase.from("media_interactions").insert({ media_id: mediaId, interaction_type: "like", session_id: device, visitor: visitorHash(request), status: "approved" });
      if (error && error.code !== "23505") throw error;
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    if (type === "comment") {
      if (!comment) return NextResponse.json({ error: "Write a comment first." }, { status: 400 });
      const { error } = await supabase.from("media_interactions").insert({ media_id: mediaId, interaction_type: "comment", session_id: device, visitor: visitorHash(request), display_name: displayName || "Anonymous", comment, status: "approved" });
      if (error) throw error;
      return response;
    }

    const { error } = await supabase.from("media_interactions").insert({ media_id: mediaId, interaction_type: "share", session_id: device, visitor: visitorHash(request), status: "approved" });
    if (error) throw error;
    return response;
  } catch (error) {
    console.error("Media interaction POST error:", error);
    return NextResponse.json({ error: error?.message || "Could not save interaction." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = getClient();
    const body = await request.json().catch(() => ({}));
    const mediaId = clean(body.mediaId, 500);
    const device = deviceId(request);
    if (!mediaId || !device) return NextResponse.json({ error: "Like not found." }, { status: 404 });
    const { error } = await supabase.from("media_interactions").delete().eq("media_id", mediaId).eq("interaction_type", "like").eq("session_id", device);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Media interaction DELETE error:", error);
    return NextResponse.json({ error: "Could not remove like." }, { status: 500 });
  }
}
