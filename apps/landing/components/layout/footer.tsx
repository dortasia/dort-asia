import Image from "next/image";
import logoImg from "@/public/DortAsiaLogo.svg";

export function Footer() {
  return (
    <footer className="py-8 bg-slate-50 border-t border-slate-100 text-center">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Image src={logoImg} alt="Dort Asia" width={120} height={35} className="h-7 w-auto" />
        <p className="text-[14px] font-medium text-slate-500">Built for real businesses.</p>
        <p className="text-[12px] text-slate-400">
          © {new Date().getFullYear()} Dort Asia. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
