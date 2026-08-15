import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { ApproachSection } from "@/components/sections/approach";
import { SoftwareProductsSection } from "@/components/sections/software-products";
import { CustomTechnologySection } from "@/components/sections/custom-technology";

export const dynamic = 'force-dynamic';


export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ApproachSection />
      <SoftwareProductsSection />
      <CustomTechnologySection />
      <Footer />
    </main>
  );
}
