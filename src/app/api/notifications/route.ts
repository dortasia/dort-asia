import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'unread'
    const type = searchParams.get('type'); // 'system', 'billing', 'subscription', 'security', 'app'
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build main query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: notifications, count: totalCount, error: fetchError } = await query;

    if (fetchError) {
      console.error('[API /notifications] Fetch error:', fetchError);
      return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 });
    }

    // Fetch unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      totalCount: totalCount || 0,
    });
  } catch (error) {
    console.error('[API /notifications] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    if (action === 'mark_read' && id) {
      const { data, error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: id,
      });

      if (error) {
        // Fallback direct update with RLS
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      const { data, error } = await supabase.rpc('mark_all_notifications_as_read');

      if (error) {
        // Fallback direct update with RLS
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_read', false);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'dismiss' && id) {
      const { data, error } = await supabase.rpc('dismiss_notification', {
        p_notification_id: id,
      });

      if (error) {
        // Fallback direct update with RLS
        await supabase
          .from('notifications')
          .update({ is_dismissed: true, is_read: true, read_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('[API /notifications] Action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
