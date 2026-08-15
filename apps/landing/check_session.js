const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"(.*?)\"/);
if (match) {
  const stripe = require('stripe')(match[1]);
  stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: 'price_1U4NvvQ6Z3Dh2Mn7VhEcinWt', quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cancel`,
    discounts: [{ coupon: 'ljnhWFCw' }]
  }).then(s => console.log('Session total:', s.amount_total, 'url:', s.url))
  .catch(e => console.log('Error:', e.message));
}
