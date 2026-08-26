import { createClient } from '@supabase/supabase-js';

async function bootstrapAdmin() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.error('Usage: npx tsx scripts/bootstrap_admin.ts <user-email>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Looking up user by email: ${targetEmail}...`);

  // 1. Find user in auth.users
  const { data: userList, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing auth users:', userError);
    process.exit(1);
  }

  const matchedUser = userList.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

  if (!matchedUser) {
    console.error(`No auth user found with email "${targetEmail}". Please sign up first.`);
    process.exit(1);
  }

  console.log(`Found Auth User ID: ${matchedUser.id}`);

  // 2. Lookup identity.accounts record
  const { data: account } = await supabase
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', matchedUser.id)
    .maybeSingle();

  // 3. Upsert into identity.admin_users
  const { data: existingAdmin } = await supabase
    .schema('identity')
    .from('admin_users')
    .select('id')
    .eq('user_id', matchedUser.id)
    .maybeSingle();

  if (existingAdmin) {
    const { error: updateErr } = await supabase
      .schema('identity')
      .from('admin_users')
      .update({
        role: 'SUPER_ADMIN',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAdmin.id);

    if (updateErr) {
      console.error('Error updating admin user:', updateErr);
      process.exit(1);
    }

    console.log(`Successfully updated existing admin record for ${targetEmail} to active SUPER_ADMIN!`);
  } else {
    const { error: insertErr } = await supabase
      .schema('identity')
      .from('admin_users')
      .insert({
        user_id: matchedUser.id,
        account_id: account?.id || null,
        role: 'SUPER_ADMIN',
        is_active: true,
      });

    if (insertErr) {
      console.error('Error inserting admin user:', insertErr);
      process.exit(1);
    }

    console.log(`Successfully granted active SUPER_ADMIN role to ${targetEmail}!`);
  }
}

bootstrapAdmin().catch(console.error);
