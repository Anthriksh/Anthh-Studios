import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { requireAdmin } from '../../_auth';
import { readPasskey, writePasskey } from '../store';

const RP_NAME = 'Anthh Studio';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await readPasskey();
  const userID = existing.userID || crypto.randomBytes(16).toString('base64url');

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: 'anthh-admin',
    userDisplayName: 'Anthh Studio',
    userID: new Uint8Array(Buffer.from(userID, 'base64url')),
    attestationType: 'none',
    excludeCredentials: existing.id ? [{ id: existing.id, transports: existing.transports }] : [],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
      authenticatorAttachment: 'platform',
    },
  });

  await writePasskey({ ...existing, userID, registrationChallenge: options.challenge });
  return NextResponse.json(options);
}
