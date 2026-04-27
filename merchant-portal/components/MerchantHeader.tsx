import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function MerchantHeader() {
  const router = useRouter();
  const path = router.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLink = (href: string, label: string, mobile = false) => {
    const isActive = path === href || path.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`hover:opacity-60 transition-opacity ${isActive ? "opacity-100" : "opacity-50"} ${
          mobile ? "text-lg py-2" : ""
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <header className="bg-black text-white px-4 md:px-8 py-5 flex items-center justify-between">
        <Link href="/merchant">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quickship Direct Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-black uppercase tracking-tighter">
              Quickship <span className="font-light opacity-40">Direct</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] items-center">
          {navLink("/merchant", "Shipments")}
          {navLink("/merchant/analytics", "Analytics")}
          {navLink("/merchant/create", "Create Label")}
          {navLink("/merchant/developer", "Developer")}
          <Link
            href="/merchant/create"
            className="bg-white text-black px-5 py-2 hover:bg-[#FFD600] transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            + New
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-4 h-0.5 bg-white"></span>
        </button>
      </header>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-black text-white px-6 pb-6 flex flex-col gap-4 text-xs font-black uppercase tracking-[0.2em] border-t border-white/10">
          {navLink("/merchant", "Shipments", true)}
          {navLink("/merchant/analytics", "Analytics", true)}
          {navLink("/merchant/create", "Create Label", true)}
          {navLink("/merchant/developer", "Developer", true)}
          <Link
            href="/merchant/create"
            onClick={() => setMobileOpen(false)}
            className="bg-[#FFD600] text-black px-5 py-3 text-center font-black uppercase mt-2"
          >
            + New Shipment
          </Link>
        </div>
      )}
    </>
  );
}
