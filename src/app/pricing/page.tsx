import { createClient } from "@/utils/supabase/server";
import { PricingContent, DynamicPricingData } from "./PricingContent";

export const revalidate = 60; // Revalidate every minute for high speed and fresh Stripe prices

const DEFAULT_PRICING: DynamicPricingData = {
  starter: {
    monthly: {
      amount: 99,
      formatted: "S$99",
      standardFormatted: "S$129/mo",
      savingsFormatted: "Save S$30/mo",
    },
    annual: {
      amount: 999,
      formatted: "S$999",
      effectiveMonthlyFormatted: "Effective S$83.25 / month",
      standardFormatted: "S$1,299/yr",
      savingsFormatted: "Save S$300/yr",
    },
  },
};

export default async function PricingPage() {
  let pricingData: DynamicPricingData = DEFAULT_PRICING;

  try {
    const supabase = await createClient();

    // Query active plans with their active prices
    const { data: plans } = await supabase
      .from('plans')
      .select(`
        id,
        name,
        stripe_product_id,
        plan_prices (
          id,
          stripe_price_id,
          interval,
          unit_amount,
          currency,
          active
        )
      `)
      .eq('active', true);

    if (plans && plans.length > 0) {
      const starterPlan = plans.find(p => p.name?.toLowerCase().includes('starter'));

      if (starterPlan && starterPlan.plan_prices) {
        const activePrices = starterPlan.plan_prices.filter((p: any) => p.active !== false);
        
        const monthlyPrice = activePrices.find((p: any) => p.interval === 'month');
        const annualPrice = activePrices.find((p: any) => p.interval === 'year');

        const resolvedMonthlyAmount = monthlyPrice ? Math.round(monthlyPrice.unit_amount / 100) : DEFAULT_PRICING.starter.monthly.amount;
        const resolvedAnnualAmount = annualPrice ? Math.round(annualPrice.unit_amount / 100) : DEFAULT_PRICING.starter.annual.amount;

        const effectiveMonthly = (resolvedAnnualAmount / 12).toFixed(2);

        pricingData = {
          starter: {
            monthly: {
              amount: resolvedMonthlyAmount,
              formatted: `S$${resolvedMonthlyAmount}`,
              standardFormatted: `S$${Math.round(resolvedMonthlyAmount * 1.3)}/mo`,
              savingsFormatted: `Save S$${Math.round(resolvedMonthlyAmount * 0.3)}/mo`,
              stripePriceId: monthlyPrice?.stripe_price_id,
            },
            annual: {
              amount: resolvedAnnualAmount,
              formatted: `S$${resolvedAnnualAmount.toLocaleString()}`,
              effectiveMonthlyFormatted: `Effective S$${effectiveMonthly} / month`,
              standardFormatted: `S$${Math.round(resolvedAnnualAmount * 1.3).toLocaleString()}/yr`,
              savingsFormatted: `Save S$${Math.round(resolvedAnnualAmount * 0.3).toLocaleString()}/yr`,
              stripePriceId: annualPrice?.stripe_price_id,
            },
          },
        };
      }
    }
  } catch (error) {
    console.error("Error loading pricing data from Supabase:", error);
    pricingData = DEFAULT_PRICING;
  }

  return <PricingContent pricingData={pricingData} />;
}
