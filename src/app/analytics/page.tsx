"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";

interface AnalyticsData {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  closedLeads: number;
  conversionRate: number;
  sources: { name: string; count: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res.data?.session) {
        router.push("/login");
      } else {
        fetchAnalytics();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/analytics");
      if (res.ok) {
        const result = await res.json();
        if (result) {
          setData(result);
        }
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 px-margin-page py-2xl">
          <div className="max-w-[1400px] mx-auto space-y-3xl">

            {/* Header */}
            <div>
              <h1 className="font-serif text-headline-md text-[36px] md:text-[42px] leading-tight text-primary mb-xs font-bold">
                Agency Lead Analytics
              </h1>
              <p className="font-sans text-body-md text-on-surface-variant text-[15px] max-w-2xl">
                Insights into agency lead acquisition, monthly inquiry volume, pipeline status distribution, and deal conversion rates.
              </p>
            </div>

            {loading || !data ? (
              <div className="py-3xl text-center font-sans text-body-md text-on-surface-variant">
                Loading analytics metrics...
              </div>
            ) : (
              <div className="space-y-3xl">

                {/* TOP METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
                  <div className="hairline-border p-xl bg-white space-y-xs">
                    <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                      TOTAL LEADS CAPTURED
                    </p>
                    <p className="font-mono text-[36px] text-primary font-bold leading-none">
                      {data.totalLeads}
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Across website & referrals
                    </p>
                  </div>

                  <div className="hairline-border p-xl bg-white space-y-xs">
                    <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                      CONVERSION RATE
                    </p>
                    <p className="font-mono text-[36px] text-emerald-800 font-bold leading-none">
                      {data.conversionRate}%
                    </p>
                    <p className="font-sans text-[11px] text-emerald-700 font-semibold">
                      Inquiries converted to clients
                    </p>
                  </div>

                  <div className="hairline-border p-xl bg-white space-y-xs">
                    <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                      AVERAGE DEAL BUDGET
                    </p>
                    <p className="font-mono text-[36px] text-primary font-bold leading-none">
                      $18,500
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Estimated contract size
                    </p>
                  </div>

                  <div className="hairline-border p-xl bg-white space-y-xs">
                    <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                      PIPELINE VELOCITY
                    </p>
                    <p className="font-mono text-[36px] text-indigo-900 font-bold leading-none">
                      1.8 days
                    </p>
                    <p className="font-sans text-[11px] text-indigo-700 font-semibold">
                      Avg time to initial contact
                    </p>
                  </div>
                </div>

                {/* CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3xl">

                  {/* Lead Growth & Monthly Volume (~60%) */}
                  <div className="lg:col-span-7 space-y-2xl">
                    
                    {/* Monthly Lead Growth Graph (Architectural Bars) */}
                    <div className="hairline-border bg-white p-2xl space-y-xl">
                      <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                        <div>
                          <span className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                            LEAD GROWTH
                          </span>
                          <h3 className="font-serif text-[20px] font-bold text-primary">
                            Monthly Inquiry Volume
                          </h3>
                        </div>
                        <span className="font-mono text-[12px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-sm py-xs font-semibold">
                          +42% Growth
                        </span>
                      </div>

                      {/* Bar Visualization */}
                      <div className="h-[220px] flex items-end justify-between gap-md pt-lg px-md">
                        {[
                          { month: "Feb", count: 12, height: "35%" },
                          { month: "Mar", count: 18, height: "48%" },
                          { month: "Apr", count: 24, height: "62%" },
                          { month: "May", count: 31, height: "78%" },
                          { month: "Jun", count: 38, height: "88%" },
                          { month: "Jul", count: 45, height: "100%" },
                        ].map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-xs group">
                            <span className="font-mono text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                              {item.count}
                            </span>
                            <div className="w-full bg-surface-container-high relative overflow-hidden h-[180px] flex items-end">
                              <div
                                className="w-full bg-primary group-hover:bg-emerald-700 transition-all duration-300"
                                style={{ height: item.height }}
                              ></div>
                            </div>
                            <span className="font-mono text-[11px] text-primary font-bold">{item.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lead Sources Breakdown */}
                    <div className="hairline-border bg-white p-2xl space-y-lg">
                      <h3 className="font-serif text-[20px] font-bold text-primary border-b border-outline-variant pb-md">
                        Lead Channels & Sources
                      </h3>

                      <div className="space-y-md">
                        {data.sources.map((src, i) => (
                          <div key={i} className="space-y-xs">
                            <div className="flex justify-between text-[13px] font-sans">
                              <span className="font-semibold text-primary">{src.name}</span>
                              <span className="font-mono font-bold text-on-surface-variant">
                                {src.count} leads ({src.percentage}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-surface-container-high relative overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${src.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Status Distribution & Pipeline Funnel (~40%) */}
                  <div className="lg:col-span-5 space-y-2xl">
                    <div className="hairline-border bg-white p-2xl space-y-xl">
                      <div>
                        <span className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                          PIPELINE STATUS
                        </span>
                        <h3 className="font-serif text-[20px] font-bold text-primary mt-xs">
                          Status Distribution
                        </h3>
                      </div>

                      <div className="space-y-lg">
                        {/* New */}
                        <div className="p-md bg-indigo-50/50 border border-indigo-100 space-y-xs">
                          <div className="flex justify-between items-center font-sans">
                            <span className="font-bold text-indigo-900 text-[14px]">NEW LEADS</span>
                            <span className="font-mono text-[16px] font-bold text-indigo-900">{data.newLeads}</span>
                          </div>
                          <p className="text-[12px] text-indigo-700">Awaiting initial agency review & outreach</p>
                        </div>

                        {/* Contacted */}
                        <div className="p-md bg-amber-50/50 border border-amber-100 space-y-xs">
                          <div className="flex justify-between items-center font-sans">
                            <span className="font-bold text-amber-900 text-[14px]">CONTACTED</span>
                            <span className="font-mono text-[16px] font-bold text-amber-900">{data.contactedLeads}</span>
                          </div>
                          <p className="text-[12px] text-amber-800">In discovery, scope negotiation, or proposal phase</p>
                        </div>

                        {/* Closed */}
                        <div className="p-md bg-emerald-50/50 border border-emerald-100 space-y-xs">
                          <div className="flex justify-between items-center font-sans">
                            <span className="font-bold text-emerald-900 text-[14px]">CLOSED CLIENTS</span>
                            <span className="font-mono text-[16px] font-bold text-emerald-900">{data.closedLeads}</span>
                          </div>
                          <p className="text-[12px] text-emerald-800">Successfully signed contracts & retainer deals</p>
                        </div>
                      </div>

                      <div className="pt-md border-t border-outline-variant text-[12px] font-sans text-on-surface-variant">
                        <p>
                          Total converted deal value for this period is estimated at <strong className="text-primary font-mono">${(data.closedLeads * 18500).toLocaleString()}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
