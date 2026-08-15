import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/lib/utils';
import { stripe } from '@/utils/stripe/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// We need service role here to create company if the user doesn't have one 
// because RLS on companies might prevent insertion without policies allowing it.
// Alternatively, we can just use the server client if insert policies are added.
export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Server misconfiguration: Missing Supabase URL or Admin Key');
      return NextResponse.json({ error: 'Server misconfiguration: Missing Supabase credentials in environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, companyName } = await req.json();

    let priceId = '';
    let couponId = '';

    if (plan === 'starter') {
      priceId = process.env.STRIPE_XENTRA_PEOPLE_PRICE_STARTER!;
      couponId = process.env.STRIPE_COUPON_STARTER || '';
    } else if (plan === 'business') {
      priceId = process.env.STRIPE_XENTRA_PEOPLE_PRICE_BUSINESS!;
      couponId = process.env.STRIPE_COUPON_BUSINESS || '';
    } else if (plan === 'enterprise') {
      return NextResponse.json(
        { error: 'Enterprise plans are custom. Please contact sales to subscribe.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price ID is not configured in .env.local' },
        { status: 500 }
      );
    }

    // 1. Check if user already belongs to a company
    const { data: userCompanies, error: userCompaniesError } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1);

    let companyId: string;

    if (userCompanies && userCompanies.length > 0) {
      companyId = userCompanies[0].company_id;
    } else {
      // 2. If no company, create one using companyName provided in request
      if (!companyName) {
        return NextResponse.json(
          { error: 'COMPANY_REQUIRED' }, // Custom error code so frontend knows to prompt
          { status: 400 }
        );
      }

      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('companies')
        .insert({ name: companyName })
        .select()
        .single();

      if (createError || !newCompany) {
        console.error('Failed to create company:', createError);
        throw new Error('Failed to create company');
      }

      companyId = newCompany.id;

      // Add user as owner of the new company
      await supabaseAdmin.from('company_users').insert({
        company_id: companyId,
        user_id: user.id,
        role: 'owner',
      });
    }

    // Use getURL() and remove trailing slash since success_url/cancel_url paths start with /
    const origin = getURL(req).replace(/\/$/, '');


    const sessionParams: any = {
      payment_method_types: ['card'], 
      billing_address_collection: 'required',
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        companyId: companyId, // Attached to company
        plan: plan,
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
