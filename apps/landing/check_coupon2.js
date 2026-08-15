const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"(.*?)\"/);
if (match) {
  const stripe = require('stripe')(match[1]);
  stripe.coupons.retrieve('ljnhWFCw')
    .then(c => console.log('Coupon:', JSON.stringify(c, null, 2)));
  stripe.prices.retrieve('price_1U4NvvQ6Z3Dh2Mn7VhEcinWt')
    .then(p => console.log('Price Product:', p.product));
}
