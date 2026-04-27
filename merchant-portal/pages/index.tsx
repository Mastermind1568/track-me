import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [trackingNo, setTrackingNo] = useState("");

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (trackingNo.trim()) {
      router.push(`/track/${trackingNo.trim()}`);
    }
  }

  return (
    <>
      <Head>
        <title>Quickship Direct — D2C Logistics Platform</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div
        className="min-h-screen bg-black text-white flex flex-col"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Nav */}
        <nav className="px-8 py-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFD600] text-black flex items-center justify-center font-black text-lg leading-none">
              Q
            </div>
            <span className="text-lg font-black uppercase tracking-tighter">
              Quickship <span className="font-light opacity-40">Direct</span>
            </span>
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] items-center">
            <a
              href="/merchant/login"
              className="bg-[#FFD600] text-black px-5 py-2 hover:bg-white transition-colors"
            >
              Merchant Portal
            </a>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              Track Your
              <br />
              <span className="font-light opacity-50">Package.</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium mb-10">
              Enter your waybill number to see real-time delivery status.
            </p>

            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto">
              <input
                type="text"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                required
                placeholder="ENTER WAYBILL NUMBER"
                className="flex-1 bg-white text-black px-6 py-5 text-sm font-black outline-none placeholder:text-gray-300 placeholder:font-bold uppercase tracking-widest"
              />
              <button
                type="submit"
                className="bg-[#FFD600] text-black px-8 py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-white transition-colors active:scale-95 border-l-4 border-black"
              >
                Track
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-white/10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            &copy; 2026 Quickship Direct Inc.
          </p>
        </footer>
      </div>
    </>
  );
}
