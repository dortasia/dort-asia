import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const next = body.next;

    if (!next || typeof next !== 'string' || !next.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid next path' }, { status: 400 });
    }

    const transactionId = crypto.randomUUID();
    const createdAt = Date.now();
    const expiresAt = createdAt + 300000; // 5 minutes

    const payload = {
      transactionId,
      userId: user.id,
      email: user.email,
      next,
      createdAt,
      expiresAt
    };

    const payloadString = JSON.stringify(payload);
    
    // Sign the payload using an HMAC with the service role key as the secret
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
    const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    const cookieValue = `${Buffer.from(payloadString).toString('base64')}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set('dort_reauth_transaction', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300 // 5 minutes
    });

    console.log('[REAUTH START]');
    console.log(`userId: ${user.id}`);
    console.log(`next: ${next}`);
    console.log(`transactionId: ${transactionId}`);
    console.log(`expiresAt: ${expiresAt}`);

    return NextResponse.json({ success: true, transactionId });
  } catch (error) {
    console.error('Error starting reauth transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
