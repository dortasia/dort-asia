'use server';

import { createClient } from "@/utils/supabase/server";
import { createNotification } from "@/services/notifications";

export async function createPasswordChangeNotification() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  const notificationId = await createNotification({
    userId: user.id,
    title: 'Password Changed',
    message: 'Your Dort Asia account password was successfully changed.',
    type: 'security',
    actionUrl: '/dashboard/settings/security',
  });

  return notificationId;
}
