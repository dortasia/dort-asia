import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

// GET /api/admin/audit-logs - Stream & filter administrative audit logs
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const resourceType = url.searchParams.get('resource_type');
  const action = url.searchParams.get('action');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

  try {
    const supabase = getServiceSupabase();

    let query = supabase
      .schema('audit')
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (resourceType && resourceType !== 'all') {
      query = query.eq('resource_type', resourceType);
    }
    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    const { data: logs, error: logsError } = await query;
    if (logsError) throw logsError;

    return NextResponse.json({ logs: logs || [] });
  } catch (error: any) {
    console.error('Error fetching admin audit logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
