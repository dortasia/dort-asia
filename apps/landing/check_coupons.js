const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"(.*?)\"/);
if (match) {
  const stripe = require('stripe')(match[1]);
  stripe.coupons.list().then(coupons => {
    console.log('Available coupons:');
    coupons.data.forEach(c => {
      console.log(`- ${c.name} (ID: ${c.id}) - ${c.amount_off ? (c.amount_off/100) + ' ' + c.currency : c.percent_off + '%'} off`);
    });
  }).catch(e => console.log('Error:', e.message));
}
