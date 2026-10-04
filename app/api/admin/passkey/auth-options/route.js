import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { readPasskey, writePasskey } from '../store';

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';

export async function GET() {
  const saved = await readPasskey();
  if (!saved.id) {
    return NextResponse.json({ error: 'No Touch ID passkey has been enrolled yet.' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'required',
    allowCredentials: [{
      id: saved.id,
      transports: saved.transports,
    }],
  });

  await writePasskey({ ...saved, authenticationChallenge: options.challenge });
  return NextResponse.json(options);
}
