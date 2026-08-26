'use server';

import { createClient } from "@/utils/supabase/server";
import { createNotification } from "@/services/notifications";

export async function create2FANotification(event: '2fa_enabled' | '2fa_disabled') {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  const title = event === '2fa_enabled' 
    ? 'Two-Factor Authentication Enabled' 
    : 'Two-Factor Authentication Disabled';
    
  const message = event === '2fa_enabled' 
    ? 'Two-factor authentication has been enabled on your Dort Asia account.' 
    : 'Two-factor authentication has been disabled on your Dort Asia account. If this wasn\'t you, secure your account immediately.';

  const notificationId = await createNotification({
    userId: user.id,
    title,
    message,
    type: 'security',
    actionUrl: '/dashboard/settings/security',
    metadata: {
      security_event: event,
      timestamp: new Date().toISOString()
    }
  });

  return notificationId;
}
