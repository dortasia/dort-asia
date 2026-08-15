const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"(.*?)\"/);
if (match) {
  const stripe = require('stripe')(match[1]);
  stripe.coupons.retrieve('zekng2vz')
    .then(c => console.log('Found zekng2vz:', c.id))
    .catch(e => console.log('Error zekng2vz:', e.message));
  stripe.coupons.retrieve('ljnhWFCw')
    .then(c => console.log('Found ljnhWFCw:', c.id))
    .catch(e => console.log('Error ljnhWFCw:', e.message));
}
