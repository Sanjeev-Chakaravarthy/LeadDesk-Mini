"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget: string;
  message: string;
  status: string;
  source: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res.data?.session) {
        router.push("/login");
      } else {
        fetchLead();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, resolvedParams.id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${resolvedParams.id}`);
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setNotes(data.lead.notes || "");
      } else {
        toast.error("Lead not found.");
      }
    } catch {
      toast.error("Failed to load lead.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.lead) {
        toast.success(`Status updated to ${newStatus}`);
        setLead(data.lead);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.lead) {
        toast.success("Agency notes saved.");
        setLead(data.lead);
      }
    } catch {
      toast.error("Failed to save notes.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 px-margin-page py-2xl">
          <div className="max-w-[1000px] mx-auto space-y-xl">
            <Link
              href="/leads"
              className="inline-flex items-center gap-xs font-sans text-[12px] uppercase tracking-wider text-on-surface-variant hover:text-primary font-semibold"
            >
              ← Back to Lead Stream
            </Link>

            {loading ? (
              <div className="py-3xl text-center font-sans text-body-md text-on-surface-variant">
                Loading lead details...
              </div>
            ) : !lead ? (
              <div className="py-3xl text-center font-sans text-body-md text-on-surface-variant bg-white hairline-border">
                Lead not found.
              </div>
            ) : (
              <div className="space-y-2xl">
                {/* Lead Banner */}
                <div className="hairline-border bg-white p-2xl space-y-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md border-b border-outline-variant pb-lg">
                    <div>
                      <span className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                        LEAD PROFILE
                      </span>
                      <h1 className="font-serif text-[32px] font-bold text-primary mt-xs">
                        {lead.name}
                      </h1>
                      <p className="font-sans text-[14px] text-on-surface-variant">
                        {lead.company ? `${lead.company} · ` : ""}{lead.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-md">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="bg-surface-container-low border border-outline-variant px-md py-sm font-sans text-[13px] text-primary focus:outline-none font-bold"
                      >
                        <option value="New">Status: New</option>
                        <option value="Contacted">Status: Contacted</option>
                        <option value="Closed">Status: Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg font-sans">
                    <div>
                      <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">BUDGET RANGE</p>
                      <p className="font-mono text-[18px] font-bold text-emerald-800">{lead.budget}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">LEAD SOURCE</p>
                      <p className="text-[15px] font-medium text-primary">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">DATE RECEIVED</p>
                      <p className="font-mono text-[14px] text-primary">
                        {new Date(lead.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inquiry Scope & Message */}
                <div className="hairline-border bg-white p-2xl space-y-md">
                  <h3 className="font-serif text-[20px] font-bold text-primary border-b border-outline-variant pb-xs">
                    Inquiry Scope & Message
                  </h3>
                  <div className="p-xl bg-surface-container-low border border-outline-variant font-sans text-[14px] text-primary leading-relaxed italic">
                    &quot;{lead.message}&quot;
                  </div>
                </div>

                {/* Internal Agency Notes */}
                <div className="hairline-border bg-white p-2xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
                    <h3 className="font-serif text-[20px] font-bold text-primary">
                      Internal Agency Notes
                    </h3>
                    <button
                      onClick={handleSaveNotes}
                      disabled={updating}
                      className="bg-primary text-white font-sans text-[11px] uppercase tracking-widest px-lg py-xs font-bold"
                    >
                      {updating ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about calls, client budget discussions, or follow-up tasks..."
                    className="w-full bg-surface-container-low border border-outline-variant p-md font-sans text-[14px] text-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
