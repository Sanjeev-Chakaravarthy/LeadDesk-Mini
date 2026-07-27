"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LeadSearchResult {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget: string;
  status: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/leads?search=${encodeURIComponent(query)}&limit=5`)
        .then((res) => (res.ok ? res.json() : { leads: [] }))
        .then((data) => setResults(data.leads || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-md cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 hairline-border cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-lg py-md border-b border-outline-variant gap-md bg-surface-container-lowest">
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search leads, emails, companies..."
            className="w-full font-sans text-body-md text-[15px] text-primary placeholder:text-outline-variant bg-transparent focus:outline-none"
          />
          <kbd className="px-xs py-[2px] font-mono text-[10px] uppercase bg-surface-container border border-outline-variant text-on-surface-variant shrink-0">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="max-h-96 overflow-y-auto p-md space-y-md">
          {/* Quick Navigation Commands */}
          {!query.trim() && (
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wider text-on-surface-variant opacity-60 font-semibold mb-xs px-xs">
                Quick Navigation
              </p>
              <div className="space-y-xs">
                {[
                  { icon: "dashboard", label: "Go to Overview Dashboard", href: "/dashboard" },
                  { icon: "contacts", label: "Go to Lead Stream & Pipeline", href: "/leads" },
                  { icon: "analytics", label: "Go to Agency Analytics", href: "/analytics" },
                  { icon: "settings", label: "Go to Agency Settings", href: "/settings" },
                  { icon: "group", label: "Manage Agency Team", href: "/members" },
                ].map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-md py-sm hover:bg-surface-container transition-colors text-left group"
                  >
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">
                        {item.icon}
                      </span>
                      <span className="font-sans text-[13px] text-primary font-medium">{item.label}</span>
                    </div>
                    <span className="font-sans text-[11px] text-on-surface-variant opacity-50 font-mono">Jump →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lead Search Results */}
          {query.trim() && (
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wider text-on-surface-variant opacity-60 font-semibold mb-xs px-xs">
                {loading ? "Searching leads..." : `Lead Results (${results.length})`}
              </p>

              {results.length === 0 && !loading && (
                <div className="py-lg text-center font-sans text-[13px] text-on-surface-variant opacity-70">
                  No leads found matching &quot;{query}&quot;
                </div>
              )}

              <div className="space-y-xs">
                {results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      router.push(`/leads/${lead.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-md py-sm hover:bg-surface-container transition-colors text-left group border-b border-outline-variant/30 last:border-0"
                  >
                    <div>
                      <p className="font-sans text-[13px] font-bold text-primary">{lead.name}</p>
                      <p className="font-sans text-[11px] text-on-surface-variant">
                        {lead.email} {lead.company ? `• ${lead.company}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-md">
                      <span className="font-mono text-[12px] font-semibold text-emerald-800">{lead.budget}</span>
                      <span className="material-symbols-outlined text-[16px] text-outline-variant group-hover:text-primary">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-lg py-xs bg-surface-container border-t border-outline-variant/40 flex justify-between items-center text-[11px] font-sans text-on-surface-variant">
          <span>Tip: Press <kbd className="font-mono text-[10px] font-bold">Cmd + K</kbd> anywhere to open search</span>
          <span>LeadDesk Mini CRM</span>
        </div>
      </div>
    </div>
  );
}
