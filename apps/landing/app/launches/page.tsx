import type { Metadata } from "next";
import { LaunchesClient } from "./launches-client";

export const metadata: Metadata = {
  title: "New Launches — Dort Asia",
  description: "Latest releases, feature updates, and changelog for all Dort Asia apps.",
};

export default function LaunchesPage() {
  return <LaunchesClient />;
}
