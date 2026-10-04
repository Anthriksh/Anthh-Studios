import fs from "node:fs/promises";
import path from "node:path";

import {
  isSupabaseConfigured,
  readPasskeyRecord,
  writePasskeyRecord,
} from "../../../lib/supabase-rest";

const file = path.join(
  process.cwd(),
  "data",
  "passkey.json"
);

export async function readPasskey() {
  if (isSupabaseConfigured()) {
    try {
      return await readPasskeyRecord();
    } catch (error) {
      console.error(
        "Supabase passkey read failed:",
        error
      );

      return {};
    }
  }

  try {
    return JSON.parse(
      await fs.readFile(file, "utf8")
    );
  } catch {
    return {};
  }
}

export async function writePasskey(value) {
  if (isSupabaseConfigured()) {
    await writePasskeyRecord(value);
    return;
  }

  await fs.mkdir(
    path.dirname(file),
    { recursive: true }
  );

  await fs.writeFile(
    file,
    JSON.stringify(value, null, 2),
    "utf8"
  );
}

export function base64urlFromBytes(bytes) {
  return Buffer
    .from(bytes)
    .toString("base64url");
}

export function bytesFromBase64url(value) {
  return new Uint8Array(
    Buffer.from(value, "base64url")
  );
}