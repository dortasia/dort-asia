import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getURL } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const origin = getURL(request).replace(/\/$/, "");

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        if (next.startsWith('http://') || next.startsWith('https://')) {
          return NextResponse.redirect(next)
        }
        return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : `/${next}`}`)
      } else {
        console.error('Auth callback error:', error.message)
      }
    }

    // Return the user to an error page or home page if auth fails
    return NextResponse.redirect(`${origin}/?error=auth`)
  } catch (error) {
    console.error('Callback route crash:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
