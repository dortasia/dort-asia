const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"(.*?)\"/);
if (match) {
  const stripe = require('stripe')(match[1]);
  stripe.subscriptions.retrieve('sub_1U4agZQ6Z3Dh2Mn7cghduwDE').then(sub => {
    console.log(JSON.stringify(sub, null, 2));
  }).catch(e => console.log('Error:', e.message));
}
