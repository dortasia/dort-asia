import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

// GET /api/admin/payments - List payments and invoices
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  try {
    const supabase = getServiceSupabase();

    // 1. Fetch payments
    let query = supabase
      .schema('billing')
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: payments, error: payError } = await query;
    if (payError) throw payError;

    // 2. Fetch associated invoices
    const invoiceIds = (payments || []).map(p => p.invoice_id).filter(Boolean);
    const { data: invoices } = await supabase
      .schema('billing')
      .from('invoices')
      .select('*')
      .in('id', invoiceIds);

    const invMap = new Map((invoices || []).map(i => [i.id, i]));

    // 3. Fetch company names
    const companyIds = Array.from(new Set((payments || []).map(p => p.company_id).filter(Boolean)));
    const { data: companies } = await supabase
      .schema('company')
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds);

    const compMap = new Map((companies || []).map(c => [c.id, c.company_name]));

    const enrichedPayments = (payments || []).map(p => {
      const inv = p.invoice_id ? invMap.get(p.invoice_id) : null;
      return {
        id: p.id,
        companyId: p.company_id,
        companyName: compMap.get(p.company_id) || 'Organization',
        invoiceId: p.invoice_id,
        stripeInvoiceId: inv?.stripe_invoice_id || null,
        invoiceUrl: inv?.invoice_url || null,
        stripePaymentIntentId: p.stripe_payment_intent_id,
        amount: Number(p.amount) || 0,
        currency: p.currency || 'SGD',
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({ payments: enrichedPayments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}
