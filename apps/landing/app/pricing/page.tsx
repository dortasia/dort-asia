import type { Metadata } from "next";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing — Dort Asia",
  description:
    "Transparent, MYR-based pricing for all Dort Asia apps. Start free, scale as you grow.",
};

export default function PricingPage() {
  return <PricingClient />;
}
