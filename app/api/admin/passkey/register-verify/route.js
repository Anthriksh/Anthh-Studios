import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { requireAdmin } from '../../_auth';
import { readPasskey, writePasskey } from '../store';

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const saved = await readPasskey();
  if (!saved.registrationChallenge) {
    return NextResponse.json({ error: 'Registration session expired. Try again.' }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: saved.registrationChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Touch ID registration was not verified.' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await writePasskey({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports || [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      userID: saved.userID,
      registrationChallenge: null,
      authenticationChallenge: null,
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Touch ID registration failed.' }, { status: 400 });
  }
}
