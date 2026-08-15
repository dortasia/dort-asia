import Stripe from 'stripe';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== '[SENSITIVE]' 
    ? process.env.STRIPE_SECRET_KEY 
    : 'sk_test_dummy_key',
  {
    apiVersion: '2026-07-29.dahlia', // Explicit version
    appInfo: {
      name: 'Dort Asia',
      url: 'https://dortasia.com',
    },
  }
);
