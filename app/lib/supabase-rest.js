import { promises as fs } from "node:fs";
import path from "node:path";

const baseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

const secretKey =
  process.env.SUPABASE_SECRET_KEY;

const bucket = "anthh-media";

export function isSupabaseConfigured() {
  return Boolean(baseUrl && secretKey);
}

function authHeaders(extra = {}) {
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    ...extra,
  };
}

async function request(url, options = {}) {
  if (!baseUrl || !secretKey) {
    throw new Error(
      "Supabase server environment is not configured."
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: authHeaders({
      ...(options.body !== undefined
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(options.headers || {}),
    }),
    cache: "no-store",
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.error_description ||
      (typeof data === "string"
        ? data
        : response.statusText);

    throw new Error(
      `Supabase request failed (${response.status}): ${message}`
    );
  }

  return data;
}


/* =========================
   SITE CONTENT
========================= */

export async function readSiteContent() {
  const rows = await request(
    `${baseUrl}/rest/v1/site_content?id=eq.main&select=content&limit=1`
  );

  return rows?.[0]?.content ?? null;
}

export async function writeSiteContent(content) {
  const rows = await request(
    `${baseUrl}/rest/v1/site_content?on_conflict=id`,
    {
      method: "POST",
      headers: {
        Prefer:
          "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: "main",
        content,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  return rows?.[0]?.content ?? content;
}


/* =========================
   ANALYTICS
========================= */

export async function insertAnalytics(event) {
  const rows = await request(
    `${baseUrl}/rest/v1/analytics_events`,
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(event),
    }
  );

  console.log(
    "Analytics row inserted:",
    rows
  );

  return rows;
}

export async function readAnalytics(
  limit = 5000
) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 5000, 1),
    5000
  );

  return request(
    `${baseUrl}/rest/v1/analytics_events?select=*&order=created_at.desc&limit=${safeLimit}`
  );
}


/* =========================
   PASSKEY
========================= */

export async function readPasskeyRecord() {
  const rows = await request(
    `${baseUrl}/rest/v1/admin_passkeys?id=eq.primary&select=data&limit=1`
  );

  return rows?.[0]?.data ?? {};
}

export async function writePasskeyRecord(data) {
  await request(
    `${baseUrl}/rest/v1/admin_passkeys?on_conflict=id`,
    {
      method: "POST",
      headers: {
        Prefer:
          "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: "primary",
        data,
        updated_at: new Date().toISOString(),
      }),
    }
  );
}


/* =========================
   STORAGE
========================= */

function encodeStoragePath(value) {
  return String(value)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

export function publicStorageUrl(storagePath) {
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(
    storagePath
  )}`;
}

export async function createSignedUpload(
  storagePath
) {
  const url =
    `${baseUrl}/storage/v1/object/upload/sign/${bucket}/${encodeStoragePath(
      storagePath
    )}`;

  const data = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  return new URL(
    data.url,
    `${baseUrl}/storage/v1`
  ).toString();
}

export async function deleteStorageObject(
  storagePath
) {
  await request(
    `${baseUrl}/storage/v1/object/${bucket}`,
    {
      method: "DELETE",
      body: JSON.stringify({
        prefixes: [storagePath],
      }),
    }
  );
}


/* =========================
   LOCAL CONTENT FALLBACK
========================= */

export async function readLocalContentFallback() {
  const file = path.join(
    process.cwd(),
    "data",
    "content.json"
  );

  return JSON.parse(
    await fs.readFile(file, "utf8")
  );
}