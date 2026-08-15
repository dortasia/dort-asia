const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"(.*?)\"/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"(.*?)\"/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function clearSubs() {
    const { error } = await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Error:', error);
    else console.log('Successfully cleared all subscriptions');
  }
  clearSubs();
}
