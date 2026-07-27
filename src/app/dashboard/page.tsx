"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";
import WorkspaceContextWidget from "@/components/WorkspaceContextWidget";
import { toast } from "sonner";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget: string;
  message: string;
  status: "New" | "Contacted" | "Closed" | string;
  source: string;
  createdAt: string;
  notes?: string;
}

interface Stats {
  workspaceName: string;
  membersCount: number;
  totalLeads: number;
  newLeadsCount: number;
  lastActivity: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    workspaceName: "Loading...",
    membersCount: 0,
    totalLeads: 0,
    newLeadsCount: 0,
    lastActivity: null,
  });

  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    closedLeads: 0,
    conversionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Quick Lead Form
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickCompany, setQuickCompany] = useState("");
  const [quickBudget, setQuickBudget] = useState("$10,000 - $25,000");
  const [quickMessage, setQuickMessage] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    authClient.getSession().then(async (res) => {
      if (!res.data?.session) {
        router.push("/login");
        return;
      }
      loadDashboardData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [wsRes, leadsRes, analyticsRes] = await Promise.all([
        fetch("/api/workspace/stats"),
        fetch("/api/leads?limit=6"),
        fetch("/api/leads/analytics"),
      ]);

      if (wsRes.status === 401) {
        const inviteRes = await fetch("/api/workspace/accept-invite", { method: "POST" });
        const inviteData = await inviteRes.json();
        if (inviteData.joined) {
          window.location.reload();
        } else {
          router.replace("/complete-setup");
        }
        return;
      }

      const wsData = await wsRes.json();
      if (wsData && !wsData.error) {
        setStats({
          workspaceName: wsData.workspaceName,
          membersCount: wsData.membersCount,
          totalLeads: wsData.totalLeads,
          newLeadsCount: wsData.newLeadsCount,
          lastActivity: wsData.lastActivity
            ? new Date(wsData.lastActivity).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Never",
        });
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (leadsData.leads) {
          setRecentLeads(leadsData.leads);
        }
      }

      if (analyticsRes.ok) {
        const anData = await analyticsRes.json();
        if (anData) {
          setAnalytics(anData);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickEmail || !quickMessage) {
      toast.error("Please enter Name, Email, and Project Details.");
      return;
    }

    setCapturing(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickName,
          email: quickEmail,
          company: quickCompany,
          budget: quickBudget,
          message: quickMessage,
          source: "Manual Entry",
        }),
      });

      const data = await res.json();
      if (data.lead) {
        toast.success("New lead captured into workspace.");
        setQuickName("");
        setQuickEmail("");
        setQuickCompany("");
        setQuickMessage("");
        loadDashboardData();
      } else {
        toast.error("Failed to capture lead.");
      }
    } catch {
      toast.error("An error occurred while creating lead.");
    } finally {
      setCapturing(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.lead) {
        toast.success(`Status updated to ${newStatus}`);
        loadDashboardData();
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="px-sm py-[2px] bg-indigo-100 text-indigo-900 border border-indigo-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            New
          </span>
        );
      case "Contacted":
        return (
          <span className="px-sm py-[2px] bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            Contacted
          </span>
        );
      case "Closed":
        return (
          <span className="px-sm py-[2px] bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-sm py-[2px] bg-gray-100 text-gray-800 border border-gray-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar workspaceName={stats.workspaceName} />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar searchPlaceholder="Search leads, clients, emails..." />

        <main className="flex-1 px-margin-page py-2xl">
          <div className="max-w-[1400px] mx-auto space-y-3xl">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
              <div>
                <h1 className="font-serif text-headline-md text-[32px] lg:text-[40px] leading-tight text-primary mb-xs font-bold">
                  Dashboard Overview
                </h1>
                <p className="font-sans text-body-md text-on-surface-variant text-[14px]">
                  Real-time agency lead stream, inquiry status management, and performance metrics.
                </p>
              </div>
              <Link
                href="/leads"
                className="bg-primary text-white font-sans text-label-sm text-[12px] uppercase tracking-widest px-xl py-md hover:opacity-90 transition-all border border-primary font-bold self-start md:self-auto"
              >
                Manage All Leads →
              </Link>
            </div>

            {/* OVERVIEW CARDS (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
              <div className="hairline-border p-xl bg-white space-y-sm">
                <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  TOTAL LEADS
                </p>
                <p className="font-mono text-[36px] text-primary font-bold leading-none">
                  {analytics.totalLeads}
                </p>
                <p className="font-sans text-[11px] text-on-surface-variant opacity-75">
                  Captured across all agency channels
                </p>
              </div>

              <div className="hairline-border p-xl bg-white space-y-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-indigo-600"></div>
                <div className="flex justify-between items-start">
                  <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                    NEW LEADS
                  </p>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                </div>
                <p className="font-mono text-[36px] text-indigo-900 font-bold leading-none">
                  {analytics.newLeads}
                </p>
                <p className="font-sans text-[11px] text-indigo-700 font-medium">
                  Awaiting initial response
                </p>
              </div>

              <div className="hairline-border p-xl bg-white space-y-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  CONTACTED
                </p>
                <p className="font-mono text-[36px] text-amber-900 font-bold leading-none">
                  {analytics.contactedLeads}
                </p>
                <p className="font-sans text-[11px] text-amber-800 font-medium">
                  Active discovery & proposals
                </p>
              </div>

              <div className="hairline-border p-xl bg-white space-y-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-emerald-600"></div>
                <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  CLOSED LEADS
                </p>
                <div className="flex items-baseline gap-xs">
                  <p className="font-mono text-[36px] text-emerald-900 font-bold leading-none">
                    {analytics.closedLeads}
                  </p>
                  <span className="font-mono text-[13px] text-emerald-700 font-semibold">
                    ({analytics.conversionRate}%)
                  </span>
                </div>
                <p className="font-sans text-[11px] text-emerald-800 font-medium">
                  Signed contract conversion rate
                </p>
              </div>
            </div>

            {/* MAIN CONTENT GRID (~60% Left / ~40% Right) */}
            <div className="grid grid-cols-12 gap-3xl">

              {/* Left Column: Quick Lead Capture & Latest Leads Table (~60%) */}
              <div className="col-span-12 lg:col-span-7 space-y-2xl">

                {/* Quick Lead Capture Form */}
                <section className="space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
                    <h3 className="font-sans text-label-sm text-[11px] tracking-widest uppercase opacity-70 font-semibold">
                      QUICK LEAD CAPTURE
                    </h3>
                    <span className="font-sans text-[11px] text-on-surface-variant italic">
                      Direct CRM entry
                    </span>
                  </div>

                  <form onSubmit={handleQuickCapture} className="hairline-border bg-white p-xl space-y-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                      <div>
                        <label className="block font-sans text-label-sm text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-base">
                          FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={quickName}
                          onChange={(e) => setQuickName(e.target.value)}
                          placeholder="e.g. Marcus Vance"
                          className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs font-sans text-[13px] text-primary focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-sans text-label-sm text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-base">
                          EMAIL ADDRESS *
                        </label>
                        <input
                          type="email"
                          required
                          value={quickEmail}
                          onChange={(e) => setQuickEmail(e.target.value)}
                          placeholder="m.vance@techventures.io"
                          className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs font-sans text-[13px] text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                      <div>
                        <label className="block font-sans text-label-sm text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-base">
                          COMPANY NAME
                        </label>
                        <input
                          type="text"
                          value={quickCompany}
                          onChange={(e) => setQuickCompany(e.target.value)}
                          placeholder="TechVentures Inc."
                          className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs font-sans text-[13px] text-primary focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-sans text-label-sm text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-base">
                          BUDGET RANGE
                        </label>
                        <select
                          value={quickBudget}
                          onChange={(e) => setQuickBudget(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant pl-md pr-10 py-sm font-sans text-[13px] text-primary focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                          <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                          <option value="$25,000+">$25,000+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-sans text-label-sm text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-base">
                        PROJECT INQUIRY / MESSAGE *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={quickMessage}
                        onChange={(e) => setQuickMessage(e.target.value)}
                        placeholder="Paste inquiry details or client scope notes..."
                        className="w-full bg-surface-container-low border border-outline-variant p-sm font-sans text-[13px] text-primary focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-xs">
                      <span className="font-sans text-label-sm text-[11px] text-on-surface-variant italic">
                        {capturing ? "Saving lead..." : "Will notify agency team"}
                      </span>
                      <button
                        type="submit"
                        disabled={capturing}
                        className="bg-primary text-on-primary font-sans text-label-sm text-[11px] uppercase tracking-widest px-lg py-sm hover:opacity-90 transition-all rounded-none border border-primary font-bold"
                      >
                        {capturing ? "Saving..." : "Add Lead →"}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Latest Leads Table */}
                <section className="space-y-md">
                  <div className="flex justify-between items-end border-b border-outline-variant pb-xs">
                    <h3 className="font-sans text-label-sm text-[11px] tracking-widest uppercase opacity-70 font-semibold">
                      LATEST INQUIRIES
                    </h3>
                    <Link
                      href="/leads"
                      className="font-sans text-label-sm text-[12px] text-primary underline underline-offset-4 hover:opacity-60 transition-opacity font-semibold"
                    >
                      View all leads ({analytics.totalLeads})
                    </Link>
                  </div>

                  <div className="w-full border-t border-outline">
                    {loading ? (
                      <div className="py-xl text-center font-sans text-body-md text-on-surface-variant">
                        Loading agency leads...
                      </div>
                    ) : recentLeads.length === 0 ? (
                      <div className="py-2xl text-center font-sans text-body-md text-on-surface-variant bg-white hairline-border">
                        No leads captured yet. Add one above or submit via landing page.
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant bg-white hairline-border">
                        {recentLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-lg hover:bg-surface-container-low transition-colors duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md"
                          >
                            <div
                              className="space-y-xs cursor-pointer flex-1"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <div className="flex items-center gap-md">
                                <h4 className="font-serif text-[17px] font-bold text-primary hover:underline">
                                  {lead.name}
                                </h4>
                                {getStatusBadge(lead.status)}
                              </div>
                              <p className="font-sans text-[13px] text-on-surface-variant">
                                {lead.company ? `${lead.company} · ` : ""}{lead.email}
                              </p>
                              <p className="font-sans text-[12px] text-on-surface-variant opacity-80 line-clamp-1 italic">
                                &quot;{lead.message}&quot;
                              </p>
                            </div>

                            <div className="flex items-center gap-lg shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-xs sm:pt-0 border-outline-variant/30">
                              <div className="text-right font-mono text-[12px] text-primary font-semibold">
                                {lead.budget}
                              </div>

                              {/* Status Dropdown */}
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                                className="bg-surface-container-low border border-outline-variant pl-sm pr-9 py-xs font-sans text-[11px] text-primary focus:outline-none rounded-none cursor-pointer"
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Agency Org Context (~40%) */}
              <div className="col-span-12 lg:col-span-5">
                <div className="sticky top-[90px] space-y-xl">
                  <WorkspaceContextWidget />

                  {/* Agency Overview Card */}
                  <div className="hairline-border bg-surface-container-low p-xl">
                    <div className="flex items-start justify-between mb-xl">
                      <div>
                        <p className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-xs">
                          AGENCY WORKSPACE
                        </p>
                        <h2 className="font-serif text-headline-md text-[20px] font-bold text-primary">
                          {stats.workspaceName}
                        </h2>
                      </div>
                      <span className="flex items-center gap-xs px-sm py-base bg-primary text-white font-sans text-[10px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px] filled">verified</span>
                        Active CRM
                      </span>
                    </div>

                    <div className="space-y-lg">
                      <div className="flex justify-between items-center py-sm border-b border-outline-variant/30">
                        <span className="font-sans text-body-md text-[14px] text-on-surface-variant">
                          Team Members
                        </span>
                        <span className="font-mono text-[13px] text-primary font-bold">
                          {stats.membersCount} active
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-sm">
                        <span className="font-sans text-body-md text-[14px] text-on-surface-variant">
                          Last Activity
                        </span>
                        <span className="font-mono text-[13px] text-primary font-bold">
                          {stats.lastActivity || "Just now"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push("/settings")}
                      className="w-full mt-xl py-md hairline-border bg-white text-primary font-sans text-label-sm text-[12px] uppercase tracking-widest hover:bg-surface-container-high transition-colors font-bold"
                    >
                      Agency Settings →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* LEAD DETAIL MODAL DRAWER */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-md cursor-pointer"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white hairline-border w-full max-w-xl p-2xl space-y-xl max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-outline-variant pb-md">
              <div>
                <span className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                  LEAD DETAILS
                </span>
                <h3 className="font-serif text-[24px] font-bold text-primary mt-xs">
                  {selectedLead.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="material-symbols-outlined text-[24px] text-on-surface-variant hover:text-primary"
              >
                close
              </button>
            </div>

            <div className="space-y-md font-sans">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">EMAIL</p>
                  <p className="text-[14px] font-mono text-primary font-bold">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">BUDGET</p>
                  <p className="text-[14px] font-mono text-emerald-800 font-bold">{selectedLead.budget}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">COMPANY</p>
                  <p className="text-[14px] text-primary">{selectedLead.company || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">SOURCE</p>
                  <p className="text-[14px] text-primary">{selectedLead.source}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-xs">
                  STATUS
                </p>
                <div className="flex items-center gap-md">
                  {getStatusBadge(selectedLead.status)}
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                    className="bg-surface-container-low border border-outline-variant px-sm py-xs font-sans text-[12px] text-primary focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-xs">
                  PROJECT MESSAGE
                </p>
                <div className="p-md bg-surface-container-low border border-outline-variant text-[13px] text-primary leading-relaxed italic">
                  &quot;{selectedLead.message}&quot;
                </div>
              </div>
            </div>

            <div className="pt-md border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-primary text-white font-sans text-label-sm text-[12px] uppercase tracking-widest px-xl py-md hover:opacity-90 transition-all font-bold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
