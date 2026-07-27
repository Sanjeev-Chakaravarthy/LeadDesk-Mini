"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";

interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  membersCount: number;
}

export default function AgencySettings() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [editName, setEditName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWorkspaceSettings = async () => {
    setLoading(true);
    try {
      const [sessionRes, statsRes, membersRes] = await Promise.all([
        authClient.getSession(),
        fetch("/api/workspace/stats").then((r) => r.json()),
        fetch("/api/workspace/members").then((r) => r.json()),
      ]);

      if (!sessionRes.data?.session) {
        router.push("/login");
        return;
      }

      const uId = sessionRes.data.user.id;
      let userRole = "Member";
      if (membersRes.members) {
        const selfMember = membersRes.members.find(
          (m: { user: { id: string }; role: string }) => m.user.id === uId
        );
        if (selfMember) userRole = selfMember.role;
      }

      setWorkspace({
        id: membersRes.members?.[0]?.organizationId || "unknown",
        name: statsRes.workspaceName || "Unknown Agency",
        role: userRole,
        membersCount: statsRes.membersCount || 1,
      });
      setEditName(statsRes.workspaceName || "");
    } catch (err) {
      console.error("Failed to load agency settings:", err);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSaveWorkspaceName = async () => {
    if (!editName.trim() || editName === workspace?.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update agency name");
      }
      setWorkspace((prev) => (prev ? { ...prev, name: editName.trim() } : prev));
      toast.success("Agency workspace updated.");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const isOwner = workspace?.role === "Owner";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 px-margin-page py-3xl">
          <div className="max-w-[760px] mx-auto space-y-2xl">
            {/* Header */}
            <div>
              <h1 className="font-serif text-[36px] md:text-[40px] leading-tight text-primary font-bold mb-xs">
                Agency Settings
              </h1>
              <p className="font-sans text-[14px] text-on-surface-variant">
                Configure your agency branding, lead notification preferences, and team workspace controls.
              </p>
            </div>

            {loading ? (
              <div className="py-xl text-center font-sans text-body-md text-on-surface-variant">
                Loading agency settings...
              </div>
            ) : (
              <div className="flex flex-col gap-2xl">
                {/* Agency Name Card */}
                <div className="hairline-border bg-white p-xl flex flex-col gap-lg">
                  <h2 className="font-sans text-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold">
                    AGENCY BRANDING & NAME
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-md items-end">
                    <div className="flex-1 w-full">
                      <label className="block font-sans text-[12px] text-on-surface-variant mb-xs" htmlFor="workspace-name">
                        Agency Name
                      </label>
                      <input
                        id="workspace-name"
                        type="text"
                        disabled={!isOwner}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:outline-none focus:ring-0 py-sm px-0 font-sans text-[15px] font-semibold text-primary transition-colors disabled:opacity-50"
                        placeholder="Agency name"
                      />
                    </div>
                    {isOwner && (
                      <button
                        onClick={handleSaveWorkspaceName}
                        disabled={saving || editName === workspace?.name || !editName.trim()}
                        className="w-full sm:w-auto bg-primary text-white font-sans text-[12px] uppercase tracking-widest py-sm px-xl border border-primary hover:opacity-90 transition-opacity rounded-none disabled:opacity-40 h-[38px] font-bold"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Lead Notification Preferences */}
                <div className="hairline-border bg-white p-xl space-y-lg">
                  <h2 className="font-sans text-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold">
                    LEAD NOTIFICATION PREFERENCES
                  </h2>

                  <div className="space-y-md font-sans">
                    <label className="flex items-center justify-between cursor-pointer p-sm bg-surface-container-low border border-outline-variant">
                      <div>
                        <p className="text-[14px] font-bold text-primary">Instant Email Alerts on New Leads</p>
                        <p className="text-[12px] text-on-surface-variant">Notify team members immediately when a website visitor submits an inquiry.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => {
                          setEmailAlerts(e.target.checked);
                          toast.success("Notification preferences updated.");
                        }}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-sm bg-surface-container-low border border-outline-variant">
                      <div>
                        <p className="text-[14px] font-bold text-primary">Daily Pipeline Summary Email</p>
                        <p className="text-[12px] text-on-surface-variant">Receive a daily breakdown of new, contacted, and closed leads at 8:00 AM.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={dailySummary}
                        onChange={(e) => {
                          setDailySummary(e.target.checked);
                          toast.success("Daily summary preferences updated.");
                        }}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Technical / Metadata Details */}
                <div className="hairline-border bg-white p-xl space-y-md">
                  <h2 className="font-sans text-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold">
                    AGENCY WORKSPACE METADATA
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-xl">
                    <div>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mb-xs font-semibold">Agency Workspace ID</p>
                      <p className="font-mono text-[13px] text-primary truncate" title={workspace?.id}>{workspace?.id}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mb-xs font-semibold">Active Team Members</p>
                      <p className="font-mono text-[13px] text-primary font-bold">{workspace?.membersCount} Members</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mb-xs font-semibold">Your Role</p>
                      <p className="font-mono text-[13px] text-primary font-bold">{workspace?.role}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mb-xs font-semibold">Multi-tenant Security</p>
                      <p className="font-sans text-[13px] text-emerald-800 font-bold flex items-center gap-xs">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full" /> Verified Isolated
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Management Link */}
                <div className="hairline-border bg-surface-container-low p-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                  <div>
                    <h3 className="font-serif text-[18px] font-bold text-primary">Team Members & Access</h3>
                    <p className="font-sans text-[13px] text-on-surface-variant">Invite agency teammates to manage leads and pipeline status.</p>
                  </div>
                  <button
                    onClick={() => router.push("/members")}
                    className="bg-primary text-white font-sans text-[12px] uppercase tracking-widest px-xl py-sm font-bold"
                  >
                    Manage Teammates →
                  </button>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
