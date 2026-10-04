import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createAdminToken, SESSION_MAX_AGE } from '../../_auth';
import { readPasskey, writePasskey } from '../store';

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export async function POST(request) {
  const body = await request.json();
  const saved = await readPasskey();

  if (!saved.id || !saved.authenticationChallenge) {
    return NextResponse.json({ error: 'No active Touch ID login.' }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: saved.authenticationChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: saved.id,
        publicKey: new Uint8Array(Buffer.from(saved.publicKey, 'base64url')),
        counter: saved.counter || 0,
        transports: saved.transports || [],
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Touch ID verification failed.' }, { status: 401 });
    }

    await writePasskey({
      ...saved,
      counter: verification.authenticationInfo.newCounter,
      authenticationChallenge: null,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('anthriksh_admin', createAdminToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Touch ID verification failed.' }, { status: 400 });
  }
}
