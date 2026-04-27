import Layout from "../../components/Layout";
import MerchantHeader from "../../components/MerchantHeader";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { Package, CheckCircle2, AlertTriangle, Truck } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/v1/shipments/analytics");
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getChartData = () => {
    if (!data || !data.status_breakdown) return [];
    
    // Default structure to ensure all statuses show up even if 0
    const structured = [
      { name: "Accepted", value: data.status_breakdown["accepted"] || 0, color: "#e5e7eb" },
      { name: "In Transit", value: data.status_breakdown["in transit"] || 0, color: "#1e3a8a" },
      { name: "Out for Delivery", value: data.status_breakdown["out for delivery"] || 0, color: "#FFD600" },
      { name: "Delivered", value: data.status_breakdown["delivered"] || 0, color: "#14532d" },
      { name: "Exception", value: data.status_breakdown["exception"] || 0, color: "#7f1d1d" }
    ];
    return structured;
  };

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">
              Analytics Overview
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Your real-time logistics performance
            </p>
          </div>
          <button className="border-4 border-black px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-black hover:text-[#FFD600] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
            Export Report
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 mb-6 font-bold text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">Crunching Numbers…</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FFD600] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <Package className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 text-black" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black/70 mb-2">Total Volume</h3>
                <div className="text-5xl font-black tracking-tighter">{data.total}</div>
                <div className="mt-4 text-xs font-bold text-black/80 flex items-center gap-1">
                  <span className="bg-white px-2 py-0.5 border border-black">+12%</span> vs last month
                </div>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <CheckCircle2 className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 text-black" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Success Rate</h3>
                <div className="text-5xl font-black tracking-tighter text-green-700">{data.success_rate}%</div>
                <div className="mt-4 text-xs font-bold text-gray-500">
                  Total successfully delivered
                </div>
              </div>

              <div className="bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(255,214,0,1)] relative overflow-hidden">
                <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 text-white" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Active Shipments</h3>
                <div className="text-5xl font-black tracking-tighter text-[#FFD600]">{data.active_shipments}</div>
                <div className="mt-4 text-xs font-bold text-gray-400">
                  Currently in the network
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-white border-4 border-black p-6">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4">
                  Current Status Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{border: '4px solid black', borderRadius: 0, fontWeight: 'bold', textTransform: 'uppercase'}}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#F7F5F0] border-4 border-black p-6">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-4">
                  Attention Required
                </h3>
                
                {(!data.status_breakdown["exception"] || data.status_breakdown["exception"] === 0) ? (
                   <div className="flex flex-col items-center justify-center h-48 text-center">
                     <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
                     <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">All clear</p>
                     <p className="text-xs text-gray-400 mt-1">No shipments currently stuck</p>
                   </div>
                ) : (
                  <div className="bg-red-50 border-l-4 border-red-700 p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="text-red-700 w-6 h-6" />
                      <div>
                        <div className="font-black text-red-900">{data.status_breakdown["exception"]} Shipments</div>
                        <div className="text-xs font-bold text-red-700 uppercase tracking-widest mt-0.5">Need attention</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mt-8 mb-4">
                  Recent Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold">
                     <span>On-Time Delivery</span>
                     <span className="text-green-700">98.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2">
                     <div className="bg-green-700 h-2" style={{width: '98.2%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-bold mt-4">
                     <span>Same-Day Fulfillment</span>
                     <span className="text-[#FFD600] bg-black px-1.5 py-0.5">85.4%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2">
                     <div className="bg-[#FFD600] h-2" style={{width: '85.4%'}}></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
