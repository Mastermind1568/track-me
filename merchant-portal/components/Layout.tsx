import React from "react";
import Head from "next/head";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-gray-50 text-black flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black flex items-center justify-center">
                <span className="text-white font-black text-sm leading-none">Q</span>
              </div>
              <span className="text-sm font-black uppercase tracking-tighter">
                Quickship <span className="font-light opacity-40">Direct</span>
              </span>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <a href="#" className="hover:text-black transition-colors">Documentation</a>
              <a href="#" className="hover:text-black transition-colors">API</a>
              <a href="#" className="hover:text-black transition-colors">Support</a>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              &copy; 2026 Quickship Direct Inc.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
