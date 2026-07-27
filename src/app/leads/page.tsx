"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget: string;
  message: string;
  status: "New" | "Contacted" | "Closed" | string;
  source: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selected Lead for Drawer / Action Menu
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // New Lead Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newBudget, setNewBudget] = useState("$10,000 - $25,000");
  const [newMessage, setNewMessage] = useState("");
  const [newSource, setNewSource] = useState("Website Form");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res.data?.session) {
        router.push("/login");
      } else {
        fetchLeads();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, search, statusFilter]);

  useEffect(() => {
    if (selectedLead) {
      setLeadNotes(selectedLead.notes || "");
    }
  }, [selectedLead]);

  const fetchLeads = (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (statusFilter) query.append("status", statusFilter);
    query.append("limit", "20");
    if (loadMore && nextCursor) {
      query.append("cursor", nextCursor);
    }

    fetch(`/api/leads?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) {
          if (loadMore) {
            setLeads((prev) => [...prev, ...data.leads]);
          } else {
            setLeads(data.leads);
          }
          setNextCursor(data.nextCursor || null);
        }
      })
      .catch((err) => console.error("Error loading leads:", err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newMessage) {
      toast.error("Please fill in Name, Email, and Message.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          company: newCompany,
          budget: newBudget,
          message: newMessage,
          source: newSource,
        }),
      });

      const data = await res.json();
      if (data.lead) {
        toast.success("Lead created successfully & email alert dispatched!");
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        setNewCompany("");
        setNewMessage("");
        fetchLeads();
      } else {
        toast.error("Failed to create lead.");
      }
    } catch {
      toast.error("Error creating lead.");
    } finally {
      setCreating(false);
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
        toast.success(`Lead status updated to ${newStatus}`);
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: leadNotes }),
      });
      const data = await res.json();
      if (data.lead) {
        toast.success("Internal agency notes saved.");
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: leadNotes } : l))
        );
        setSelectedLead(data.lead);
      }
    } catch {
      toast.error("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Lead deleted.");
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        setSelectedIds((prev) => prev.filter((id) => id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      }
    } catch {
      toast.error("Failed to delete lead.");
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/leads/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated ${selectedIds.length} leads to ${status}`);
        setLeads((prev) =>
          prev.map((l) => (selectedIds.includes(l.id) ? { ...l, status } : l))
        );
        setSelectedIds([]);
      }
    } catch {
      toast.error("Bulk status update failed.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return;
    try {
      const res = await fetch("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Deleted ${selectedIds.length} leads.`);
        setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
        setSelectedIds([]);
      }
    } catch {
      toast.error("Bulk deletion failed.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open("/api/leads/export", "_blank");
    toast.success("CSV export initiated.");
  };

  // Checkbox Selection Helpers
  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sorting
  const sortedLeads = [...leads].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="px-sm py-[3px] bg-indigo-100 text-indigo-900 border border-indigo-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            New
          </span>
        );
      case "Contacted":
        return (
          <span className="px-sm py-[3px] bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            Contacted
          </span>
        );
      case "Closed":
        return (
          <span className="px-sm py-[3px] bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-sm py-[3px] bg-gray-100 text-gray-800 border border-gray-200 font-mono text-[10px] uppercase font-bold tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar onSearch={setSearch} searchPlaceholder="Search by name, email, company..." />

        <main className="flex-1">
          <section className="px-margin-page py-2xl">
            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-lg mb-xl">
              <div>
                <div className="flex flex-wrap items-center gap-md mb-xs">
                  <h1 className="font-serif text-display-lg text-[32px] md:text-[40px] text-primary font-bold tracking-tight">
                    Lead Stream & Pipeline
                  </h1>
                  <span className="whitespace-nowrap shrink-0 inline-flex items-center px-md py-[4px] bg-surface-container-low border border-outline-variant font-mono text-[12px] font-bold text-primary hairline-border">
                    {leads.length} {leads.length === 1 ? "Lead" : "Leads"} Total
                  </span>
                </div>
                <p className="font-sans text-body-lg text-[15px] text-on-surface-variant max-w-2xl">
                  Capture, qualify, and convert website inquiries into agency retainer clients.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-sm sm:gap-md">
                {/* View Mode Switcher */}
                <div className="flex items-center border border-outline-variant bg-surface-container-low p-[2px] hairline-border shrink-0">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-xs px-md py-xs font-sans text-[12px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === "table"
                        ? "bg-white text-primary shadow-2xs border border-outline-variant/60"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">table_rows</span> Table
                  </button>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-xs px-md py-xs font-sans text-[12px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === "kanban"
                        ? "bg-white text-primary shadow-2xs border border-outline-variant/60"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">view_kanban</span> Kanban Board
                  </button>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant pl-md pr-10 py-sm font-sans text-label-sm text-[12px] text-primary focus:outline-none rounded-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Closed">Closed</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
                  className="bg-surface-container-low border border-outline-variant pl-md pr-10 py-sm font-sans text-label-sm text-[12px] text-primary focus:outline-none rounded-none cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="name">Sort: Name A-Z</option>
                </select>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-xs bg-surface-container-low hover:bg-surface-container text-primary font-sans text-[12px] uppercase font-bold tracking-wider px-lg py-sm border border-outline-variant transition-colors hairline-border shrink-0"
                  title="Export to CSV"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
                </button>

                {/* Add Lead Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary text-white font-sans text-label-sm text-[12px] uppercase tracking-widest px-xl py-sm hover:opacity-90 transition-all border border-primary font-bold shadow-xs shrink-0"
                >
                  + Add Lead
                </button>
              </div>
            </div>

            {/* Bulk Action Floating Bar */}
            {selectedIds.length > 0 && (
              <div className="mb-lg p-md bg-primary text-white flex flex-wrap items-center justify-between gap-md animate-in fade-in slide-in-from-top-2 duration-150 hairline-border">
                <div className="flex items-center gap-md font-sans text-[13px] font-bold">
                  <span className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center font-mono text-[11px]">
                    {selectedIds.length}
                  </span>
                  <span>Leads Selected</span>
                </div>
                <div className="flex items-center gap-md">
                  <span className="font-sans text-[11px] uppercase tracking-wider opacity-80 font-semibold">Bulk Set Status:</span>
                  <button
                    onClick={() => handleBulkStatus("New")}
                    className="px-md py-xs bg-indigo-950 text-indigo-200 border border-indigo-800 text-[11px] uppercase font-bold hover:bg-indigo-900"
                  >
                    Mark New
                  </button>
                  <button
                    onClick={() => handleBulkStatus("Contacted")}
                    className="px-md py-xs bg-amber-950 text-amber-200 border border-amber-800 text-[11px] uppercase font-bold hover:bg-amber-900"
                  >
                    Mark Contacted
                  </button>
                  <button
                    onClick={() => handleBulkStatus("Closed")}
                    className="px-md py-xs bg-emerald-950 text-emerald-200 border border-emerald-800 text-[11px] uppercase font-bold hover:bg-emerald-900"
                  >
                    Mark Closed
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-md py-xs bg-red-950 text-red-200 border border-red-800 text-[11px] uppercase font-bold hover:bg-red-900 ml-md"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-zinc-400 hover:text-white text-[12px] underline ml-md"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            {/* LEADS CONTENT AREA */}
            {viewMode === "table" ? (
              /* TABLE VIEW */
              <div className="w-full border-t border-outline bg-white hairline-border shadow-xs">
                {/* Header Row */}
                <div className="grid grid-cols-12 py-md px-md border-b border-outline-variant bg-surface-container-low text-on-surface-variant items-center">
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer rounded-none accent-primary"
                    />
                  </div>
                  <div className="col-span-3 font-sans text-label-sm text-[11px] uppercase tracking-wider font-semibold">Lead Name</div>
                  <div className="col-span-3 font-sans text-label-sm text-[11px] uppercase tracking-wider font-semibold">Email & Company</div>
                  <div className="col-span-2 font-sans text-label-sm text-[11px] uppercase tracking-wider font-semibold">Budget Range</div>
                  <div className="col-span-2 font-sans text-label-sm text-[11px] uppercase tracking-wider font-semibold">Pipeline Status</div>
                  <div className="col-span-1 font-sans text-label-sm text-[11px] uppercase tracking-wider font-semibold text-right">Actions</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-outline-variant">
                  {loading ? (
                    <div className="py-3xl text-center font-sans text-body-md text-on-surface-variant">
                      Loading agency lead stream...
                    </div>
                  ) : sortedLeads.length === 0 ? (
                    <div className="py-3xl text-center font-sans text-body-md text-on-surface-variant">
                      No leads found matching your criteria.
                    </div>
                  ) : (
                    sortedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`grid grid-cols-1 md:grid-cols-12 py-lg px-md hover:bg-surface-container-low transition-colors cursor-pointer items-center group duration-150 gap-sm md:gap-0 ${
                          selectedIds.includes(lead.id) ? "bg-surface-container-low/80" : ""
                        }`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <div className="col-span-1 hidden md:flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(lead.id)}
                            onChange={() => toggleSelectOne(lead.id)}
                            className="cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                          <h4 className="font-serif font-bold text-primary text-[16px] group-hover:underline">
                            {lead.name}
                          </h4>
                          <p className="font-sans text-[11px] text-on-surface-variant md:hidden">
                            {lead.email}
                          </p>
                        </div>

                        <div className="col-span-12 md:col-span-3 font-sans text-[13px] text-on-surface-variant">
                          <span className="font-medium text-primary">{lead.email}</span>
                          {lead.company && <span className="block text-[12px] opacity-75">{lead.company}</span>}
                        </div>

                        <div className="col-span-12 md:col-span-2 font-mono text-[13px] font-bold text-emerald-800">
                          {lead.budget}
                        </div>

                        <div className="col-span-12 md:col-span-2 flex items-center gap-sm" onClick={(e) => e.stopPropagation()}>
                          {getStatusBadge(lead.status)}
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                            className="bg-surface-container-low border border-outline-variant pl-sm pr-9 py-xs font-sans text-[11px] text-primary focus:outline-none cursor-pointer"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>

                        <div className="col-span-12 md:col-span-1 font-mono text-[12px] text-right text-on-surface-variant flex items-center justify-end gap-md">
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-on-surface-variant hover:text-primary transition-colors p-xs"
                            title={`Email ${lead.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLead(lead.id);
                            }}
                            className="text-on-surface-variant hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Lead"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Load More Section */}
                {nextCursor && (
                  <div className="py-2xl flex justify-center border-t border-outline-variant bg-surface-container-low/30">
                    <button
                      onClick={() => fetchLeads(true)}
                      disabled={loadingMore}
                      className="px-3xl py-md border border-outline hover:border-primary hover:bg-surface-container transition-all group rounded-none disabled:opacity-50 hairline-border bg-white"
                    >
                      <span className="font-sans text-label-sm text-[12px] uppercase tracking-widest text-on-surface-variant group-hover:text-primary font-semibold">
                        {loadingMore ? "Loading..." : "Load More Leads"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* KANBAN BOARD VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {[
                  { key: "New", title: "New Inquiries", count: sortedLeads.filter((l) => l.status === "New").length, color: "border-indigo-600" },
                  { key: "Contacted", title: "In Conversation", count: sortedLeads.filter((l) => l.status === "Contacted").length, color: "border-amber-500" },
                  { key: "Closed", title: "Closed & Won", count: sortedLeads.filter((l) => l.status === "Closed").length, color: "border-emerald-600" },
                ].map((column) => (
                  <div key={column.key} className="bg-surface-container-low border border-outline-variant p-md space-y-md hairline-border">
                    <div className={`flex items-center justify-between border-b-2 ${column.color} pb-sm px-xs`}>
                      <h3 className="font-serif font-bold text-[16px] text-primary">{column.title}</h3>
                      <span className="font-mono text-[12px] font-bold px-sm py-[2px] bg-white border border-outline-variant text-primary">
                        {column.count}
                      </span>
                    </div>

                    <div className="space-y-md">
                      {sortedLeads
                        .filter((l) => l.status === column.key)
                        .map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-white border border-outline-variant p-md space-y-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group hairline-border"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-serif font-bold text-[15px] text-primary group-hover:underline">
                                {lead.name}
                              </h4>
                              <span className="font-mono text-[12px] font-bold text-emerald-800 bg-emerald-50 px-xs py-[2px] border border-emerald-200">
                                {lead.budget}
                              </span>
                            </div>

                            <p className="font-sans text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">
                              &quot;{lead.message}&quot;
                            </p>

                            <div className="pt-xs border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-sans text-on-surface-variant">
                              <span>{lead.company || lead.email}</span>
                              <div className="flex items-center gap-xs">
                                <a
                                  href={`mailto:${lead.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-primary p-xs"
                                  title="Send Email"
                                >
                                  <span className="material-symbols-outlined text-[16px]">mail</span>
                                </a>
                                {column.key === "New" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(lead.id, "Contacted");
                                    }}
                                    className="hover:text-primary font-bold font-mono text-[10px] uppercase underline"
                                  >
                                    Contact →
                                  </button>
                                )}
                                {column.key === "Contacted" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(lead.id, "Closed");
                                    }}
                                    className="hover:text-emerald-700 font-bold font-mono text-[10px] uppercase underline"
                                  >
                                    Close →
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* LEAD DETAIL SLIDE-OVER DRAWER */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end cursor-pointer"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white hairline-border w-full max-w-xl p-2xl space-y-xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col justify-between cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-xl">
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <div>
                  <span className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                    AGENCY LEAD DOSSIER
                  </span>
                  <h3 className="font-serif text-[28px] font-bold text-primary mt-xs">
                    {selectedLead.name}
                  </h3>
                  {selectedLead.company && (
                    <p className="font-sans text-[13px] text-on-surface-variant font-medium">
                      {selectedLead.company}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="material-symbols-outlined text-[24px] text-on-surface-variant hover:text-primary p-xs"
                >
                  close
                </button>
              </div>

              {/* Quick Communication Actions */}
              <div className="flex gap-md">
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 flex items-center justify-center gap-xs bg-primary text-white py-sm px-md font-sans text-[12px] uppercase font-bold tracking-wider hover:opacity-90 transition-all text-center"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span> Email Lead
                </a>
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 flex items-center justify-center gap-xs bg-surface-container-low text-primary border border-outline-variant py-sm px-md font-sans text-[12px] uppercase font-bold tracking-wider hover:bg-surface-container transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span> Call Phone
                  </a>
                )}
              </div>

              {/* Dossier Grid */}
              <div className="space-y-md font-sans">
                <div className="grid grid-cols-2 gap-md p-md bg-surface-container-low border border-outline-variant">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">EMAIL ADDRESS</p>
                    <p className="text-[13px] font-mono text-primary font-bold break-all">{selectedLead.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">BUDGET RANGE</p>
                    <p className="text-[14px] font-mono text-emerald-800 font-bold">{selectedLead.budget}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">LEAD SOURCE</p>
                    <p className="text-[13px] text-primary font-medium">{selectedLead.source}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">DATE ARRIVED</p>
                    <p className="text-[13px] font-mono text-primary">
                      {new Date(selectedLead.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-xs">
                    PIPELINE STAGE
                  </p>
                  <div className="flex items-center gap-md">
                    {getStatusBadge(selectedLead.status)}
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                      className="bg-surface-container-low border border-outline-variant pl-sm pr-9 py-xs font-sans text-[12px] text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-xs">
                    CLIENT INQUIRY MESSAGE
                  </p>
                  <div className="p-md bg-surface-container-low border border-outline-variant text-[13px] text-primary leading-relaxed italic">
                    &quot;{selectedLead.message}&quot;
                  </div>
                </div>

                {/* Internal Agency Notes */}
                <div>
                  <div className="flex justify-between items-center mb-xs">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      INTERNAL AGENCY NOTES
                    </p>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="font-sans text-[10px] uppercase tracking-wider font-bold text-primary hover:underline"
                    >
                      {savingNotes ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Add private agency notes, call summaries, or proposal specs..."
                    className="w-full bg-white border border-outline-variant p-md font-sans text-[13px] text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="pt-md border-t border-outline-variant flex justify-between items-center">
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-red-700 font-sans text-[12px] uppercase font-bold hover:underline"
              >
                Delete Lead
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-primary text-white font-sans text-label-sm text-[12px] uppercase tracking-widest px-xl py-md hover:opacity-90 transition-all font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-md cursor-pointer"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white hairline-border w-full max-w-lg p-2xl space-y-xl max-h-[90vh] overflow-y-auto shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-outline-variant pb-md">
              <div>
                <h3 className="font-serif text-[24px] font-bold text-primary">Capture New Lead</h3>
                <p className="font-sans text-[13px] text-on-surface-variant">Manually add an inquiry to your agency pipeline.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="material-symbols-outlined text-[24px] text-on-surface-variant">
                close
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-md font-sans">
              <div>
                <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Marcus Vance"
                  className="w-full bg-surface-container-low border border-outline-variant p-sm text-[13px] text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Client Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="marcus@company.com"
                  className="w-full bg-surface-container-low border border-outline-variant p-sm text-[13px] text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="TechVentures Inc."
                    className="w-full bg-surface-container-low border border-outline-variant p-sm text-[13px] text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Budget Range</label>
                  <select
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant pl-md pr-10 py-sm text-[13px] text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                    <option value="$25,000+">$25,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Lead Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant pl-md pr-10 py-sm text-[13px] text-primary focus:outline-none cursor-pointer"
                >
                  <option value="Website Form">Website Form</option>
                  <option value="Referral">Referral</option>
                  <option value="Direct Inquiry">Direct Inquiry</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider opacity-70 font-semibold mb-base">Inquiry Message *</label>
                <textarea
                  rows={3}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Details about project scope, deliverables, timeline..."
                  className="w-full bg-surface-container-low border border-outline-variant p-sm text-[13px] text-primary focus:outline-none"
                />
              </div>

              <div className="pt-md border-t border-outline-variant flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-xl py-sm border border-outline text-primary text-[12px] uppercase font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-primary text-white px-xl py-sm text-[12px] uppercase font-bold tracking-widest hover:opacity-90"
                >
                  {creating ? "Adding..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
