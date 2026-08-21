import { Metadata } from 'next';
import { constructMetadata } from "@/config/seo";
import WorkWithUsPage from "../work-with-us/page";

export const metadata: Metadata = constructMetadata({
  title: 'Contact Us',
  description: 'Connect with Dort Asia for world-class technology talent, dedicated engineers, and bespoke software solutions.',
  alternates: {
    canonical: "/contact",
  },
});

export default WorkWithUsPage;
