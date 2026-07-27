"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";

const faqs = [
  {
    q: "What is LeadDesk Mini?",
    a: "LeadDesk Mini is a modern, agency-first lead management SaaS CRM. It helps creative, digital, and software agencies capture website inquiries, organize client pipelines, and convert visitors into clients.",
  },
  {
    q: "How do website inquiries sync to my dashboard?",
    a: "LeadDesk Mini provides a simple REST API endpoint or embeddable inquiry form. Any submission on your website immediately syncs live to your agency workspace.",
  },
  {
    q: "How does status management work?",
    a: "Leads progress through three primary pipeline statuses: New (indigo badge), Contacted (amber badge), and Closed (emerald badge). You can update status directly from the table or lead details drawer.",
  },
  {
    q: "How is my agency data isolated?",
    a: "Every API query is automatically filtered by your organizationId, which is resolved server-side from your session token. Your agency leads and client data stay completely isolated.",
  },
  {
    q: "How do I invite agency teammates?",
    a: "Navigate to the Agency Team page from the sidebar, enter your teammate's corporate email, and click Invite. They will be linked to your agency workspace.",
  },
  {
    q: "What metrics are tracked in Analytics?",
    a: "LeadDesk Mini tracks total inquiries, monthly lead growth, status distribution, lead sources (Website, Referral, LinkedIn), conversion rate percentage, and average deal budget.",
  },
];

export default function HelpCenter() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res.data?.session) router.push("/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 px-margin-page py-3xl">
          <div className="max-w-[860px] mx-auto space-y-3xl">
            {/* Header */}
            <div>
              <div className="flex items-center gap-md mb-md">
                <span className="material-symbols-outlined text-primary text-[32px]">help</span>
                <h1 className="font-serif text-[36px] md:text-[40px] leading-tight text-primary font-bold">
                  LeadDesk Mini Help Center
                </h1>
              </div>
              <p className="font-sans text-body-md text-[15px] text-on-surface-variant max-w-[60ch]">
                Everything you need to know about LeadDesk Mini — from capturing website inquiries to closing agency clients.
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              {[
                { icon: "contacts", label: "Manage Leads", href: "/leads" },
                { icon: "analytics", label: "View Analytics", href: "/analytics" },
                { icon: "group", label: "Agency Team", href: "/members" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-md px-lg py-md border border-outline-variant hover:border-primary hover:bg-surface-container transition-all group hairline-border bg-white"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px] transition-colors">
                    {item.icon}
                  </span>
                  <span className="font-sans text-label-sm text-[13px] text-primary font-bold">
                    {item.label}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-outline-variant ml-auto group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant" />

            {/* FAQ */}
            <div className="space-y-xl">
              <h2 className="font-serif text-[24px] font-bold text-primary">Frequently Asked Questions</h2>
              <div className="flex flex-col divide-y divide-outline-variant border-t border-b border-outline-variant bg-white hairline-border">
                {faqs.map((faq, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => setOpen(open === idx ? null : idx)}
                      className="w-full flex items-center justify-between py-lg px-md text-left hover:bg-surface-container-low transition-colors group"
                    >
                      <span className="font-sans text-[15px] font-bold text-primary pr-md">
                        {faq.q}
                      </span>
                      <span
                        className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 flex-shrink-0"
                        style={{ transform: open === idx ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        expand_more
                      </span>
                    </button>
                    {open === idx && (
                      <div className="px-md pb-lg">
                        <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed max-w-[70ch]">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-xl border-t border-outline-variant">
              <p className="font-sans text-[13px] text-on-surface-variant opacity-80">
                Need architectural details? Review the{" "}
                <a href="/how-it-works" className="underline underline-offset-4 font-semibold text-primary">
                  Data Isolation Overview
                </a>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
