"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/utils/auth-client";
import Brand from "@/components/Brand";
import DigitalHeroesFooter from "@/components/DigitalHeroesFooter";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form state for interactive Contact Form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactBudget, setContactBudget] = useState("$10,000 - $25,000");
  const [contactMessage, setContactMessage] = useState("");

  // Check auth session: Logged in users bypass Welcome Page and go directly to /dashboard
  useEffect(() => {
    authClient
      .getSession()
      .then((res) => {
        if (res?.data?.session) {
          router.replace("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill in Name, Email, and Message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          company: contactCompany,
          budget: contactBudget,
          message: contactMessage,
          source: "Landing Page Live Demo",
        }),
      });

      const data = await res.json();
      if (data.success || data.lead) {
        toast.success("Test lead captured! Email alert dispatched & live entry created.");
        setContactName("");
        setContactEmail("");
        setContactCompany("");
        setContactMessage("");
      } else {
        toast.error("Failed to submit inquiry.");
      }
    } catch {
      toast.error("An error occurred while sending your inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const faqs = [
    {
      q: "How does LeadDesk Mini capture leads from our agency website?",
      a: "LeadDesk Mini provides a lightweight REST API endpoint and embeddable form. Any inquiry submitted on your website immediately syncs to your agency dashboard in real time.",
    },
    {
      q: "Can our whole agency team collaborate on inquiries?",
      a: "Yes! LeadDesk Mini supports multi-member agency workspaces. Teammates can qualify leads, add internal notes, update status, and track deal stages together.",
    },
    {
      q: "Are email alerts sent when a new inquiry arrives?",
      a: "Yes. Whenever a lead is captured, LeadDesk Mini automatically resolves workspace team members and sends an email notification containing lead details and scope.",
    },
    {
      q: "Is there a free trial or free tier?",
      a: "Yes. You can start free with full access to lead capture, pipeline tracking, CSV export, and agency analytics without entering a credit card.",
    },
  ];

  // While verifying session, render a clean loading splash
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-md font-sans">
        <Brand theme="light" />
        <p className="text-[13px] text-on-surface-variant font-medium animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-primary selection:text-white">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-outline-variant px-margin-page py-md hairline-border">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Brand theme="light" showTagline={false} />

          <div className="hidden md:flex items-center gap-xl font-sans text-label-sm text-[13px]">
            <button onClick={() => scrollToSection("features")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              How it Works
            </button>
            <button onClick={() => scrollToSection("sandbox")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Live Demo
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-md">
            <Link
              href="/login"
              className="font-sans text-label-sm text-[13px] text-primary hover:opacity-75 transition-opacity px-md py-xs font-semibold"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-primary text-white font-sans text-label-sm text-[12px] uppercase tracking-widest px-lg py-md hover:opacity-90 transition-all border border-primary font-bold shadow-xs"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — generous vertical padding for breathing room
          ═══════════════════════════════════════════════════════════════ */}
      <section className="px-margin-page py-[80px] md:py-[120px] border-b border-outline-variant bg-surface">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-[60px] lg:gap-[80px] items-center">
          <div className="lg:col-span-7 space-y-2xl">
            <div className="inline-flex items-center gap-xs px-md py-xs bg-surface-container-high border border-outline-variant text-[11px] font-mono text-primary uppercase tracking-widest hairline-border">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              LEADDESK MINI FOR DIGITAL AGENCIES
            </div>

            <h1 className="font-serif text-display-lg text-[42px] sm:text-[54px] lg:text-[64px] leading-[1.08] text-primary tracking-tight font-bold">
              Turn Every Website Visitor Into Your Next Client.
            </h1>

            <p className="font-sans text-body-lg text-[18px] sm:text-[20px] text-on-surface-variant max-w-2xl leading-[1.7]">
              LeadDesk Mini helps agencies capture website inquiries, organize client pipelines, and convert visitors from one high-craft dashboard.
            </p>

            <div className="flex flex-wrap items-center gap-lg pt-md">
              <Link
                href="/register"
                className="bg-primary text-white font-sans text-label-sm text-[13px] uppercase tracking-widest px-2xl py-lg hover:opacity-90 transition-all font-bold border border-primary shadow-sm"
              >
                Start Free Workspace →
              </Link>
              <button
                onClick={() => scrollToSection("sandbox")}
                className="hairline-border bg-white text-primary font-sans text-label-sm text-[13px] uppercase tracking-widest px-2xl py-lg hover:bg-surface-container-low transition-all font-semibold"
              >
                Try Live Sandbox
              </button>
            </div>

            <div className="pt-lg flex items-center gap-2xl text-on-surface-variant font-sans text-[13px] flex-wrap">
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span> Instant API & Form Sync
              </span>
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span> No credit card required
              </span>
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span> Unlimited lead capture
              </span>
            </div>
          </div>

          {/* Interactive Hero Screenshot / Lead Management UI Preview */}
          <div className="lg:col-span-5">
            <div className="hairline-border bg-white p-xl shadow-xl space-y-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant pb-md">
                <div className="flex items-center gap-sm">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="font-mono text-[11px] text-on-surface-variant ml-sm">agency-leads.stream</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-sm py-base font-semibold">
                  LIVE PIPELINE
                </span>
              </div>

              {/* Sample Lead Cards in Preview */}
              <div className="space-y-md">
                <div className="hairline-border p-md bg-surface-container-low hover:bg-white transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-primary">Marcus Vance</h4>
                      <p className="font-sans text-[12px] text-on-surface-variant mt-[2px]">TechVentures Inc. · $15k-$25k</p>
                    </div>
                    <span className="px-sm py-[2px] bg-indigo-100 text-indigo-900 font-mono text-[10px] font-bold uppercase border border-indigo-200">
                      New
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-on-surface-variant line-clamp-2 italic">
                    &quot;Looking to completely redesign our SaaS landing page and web app.&quot;
                  </p>
                </div>

                <div className="hairline-border p-md bg-white hover:bg-surface-container-low transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-primary">Sophia Chen</h4>
                      <p className="font-sans text-[12px] text-on-surface-variant mt-[2px]">Luminate Health · $25k+</p>
                    </div>
                    <span className="px-sm py-[2px] bg-amber-100 text-amber-900 font-mono text-[10px] font-bold uppercase border border-amber-200">
                      Contacted
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-on-surface-variant line-clamp-2 italic">
                    &quot;Need brand identity refresh and custom Webflow development.&quot;
                  </p>
                </div>

                <div className="hairline-border p-md bg-white hover:bg-surface-container-low transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-primary">David Miller</h4>
                      <p className="font-sans text-[12px] text-on-surface-variant mt-[2px]">Acme Enterprises · $10k-$15k</p>
                    </div>
                    <span className="px-sm py-[2px] bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold uppercase border border-emerald-200">
                      Closed
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-on-surface-variant line-clamp-2 italic">
                    &quot;Monthly creative retainer for ad design & copy.&quot;
                  </p>
                </div>
              </div>

              <div className="pt-md border-t border-outline-variant flex justify-between items-center text-[12px] font-sans">
                <span className="text-on-surface-variant">Avg. Response Time: <strong className="text-primary font-mono">14 mins</strong></span>
                <span className="text-emerald-700 font-semibold font-mono">Conversion: 42%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUSTED BY AGENCIES — light divider section
          ═══════════════════════════════════════════════════════════════ */}
      <section className="px-margin-page py-[48px] border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-[1400px] mx-auto text-center space-y-xl">
          <p className="font-sans text-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70 font-semibold">
            TRUSTED BY HIGH-GROWTH CREATIVE & DEVELOPMENT AGENCIES WORLDWIDE
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2xl items-center justify-center pt-sm opacity-80">
            <span className="font-serif text-[20px] tracking-wider text-primary font-bold">APEX CREATIVE</span>
            <span className="font-mono text-[18px] tracking-widest text-primary font-bold">STUDIO ZERO</span>
            <span className="font-sans text-[18px] font-extrabold uppercase tracking-tight text-primary">NEXUS LABS</span>
            <span className="font-serif italic text-[22px] text-primary">Vanguard Digital</span>
            <span className="font-mono text-[18px] font-semibold text-primary">METACOLLECTIVE</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION — spacious cards with generous padding
          ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="px-margin-page py-[80px] md:py-[100px] border-b border-outline-variant bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-2xl mb-[60px]">
            <span className="font-sans text-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70 font-semibold">
              AGENCY-FIRST CAPABILITIES
            </span>
            <h2 className="font-serif text-headline-md text-[36px] md:text-[44px] text-primary leading-tight mt-sm font-bold">
              Built Specifically for How Agencies Qualify and Close Leads.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
            <div className="hairline-border p-[32px] space-y-lg bg-surface-container-low hover:bg-white transition-all">
              <span className="material-symbols-outlined text-[36px] text-primary">contact_mail</span>
              <h3 className="font-serif text-[22px] text-primary font-bold">Instant Lead Capture</h3>
              <p className="font-sans text-[14px] text-on-surface-variant leading-[1.8]">
                Connect your website contact forms, landing page widgets, or custom APIs in minutes. Every inquiry lands cleanly in your agency inbox.
              </p>
            </div>

            <div className="hairline-border p-[32px] space-y-lg bg-surface-container-low hover:bg-white transition-all">
              <span className="material-symbols-outlined text-[36px] text-primary">view_kanban</span>
              <h3 className="font-serif text-[22px] text-primary font-bold">Dual View Pipeline</h3>
              <p className="font-sans text-[14px] text-on-surface-variant leading-[1.8]">
                Switch between high-density Table stream and visual Kanban Board. Categorize inquiries across New, Contacted, and Closed stages.
              </p>
            </div>

            <div className="hairline-border p-[32px] space-y-lg bg-surface-container-low hover:bg-white transition-all">
              <span className="material-symbols-outlined text-[36px] text-primary">analytics</span>
              <h3 className="font-serif text-[22px] text-primary font-bold">Conversion Analytics</h3>
              <p className="font-sans text-[14px] text-on-surface-variant leading-[1.8]">
                Track monthly inquiry growth, top lead sources (Website, Referral, LinkedIn), deal budget ranges, and client conversion rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS — spacious step cards
          ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-margin-page py-[80px] md:py-[100px] border-b border-outline-variant bg-surface">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-[60px]">
            <span className="font-sans text-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70 font-semibold">
              SIMPLE 3-STEP WORKFLOW
            </span>
            <h2 className="font-serif text-headline-md text-[36px] md:text-[44px] text-primary leading-tight mt-sm font-bold">
              From Inquiry to Signed Retainer in Minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
            {[
              {
                step: "01",
                title: "Connect Form or API",
                desc: "Embed our inquiry form snippet or connect your custom site form to our REST API endpoint.",
              },
              {
                step: "02",
                title: "Qualify & Assign",
                desc: "Review incoming leads with budget tags, source details, and internal agency team notes.",
              },
              {
                step: "03",
                title: "Convert & Export",
                desc: "Move deals to Closed status, send email replies directly, and export full lead data to CSV.",
              },
            ].map((item) => (
              <div key={item.step} className="hairline-border bg-white p-[32px] space-y-lg">
                <span className="font-mono text-[28px] font-bold text-primary opacity-30">{item.step}</span>
                <h3 className="font-serif text-[20px] font-bold text-primary">{item.title}</h3>
                <p className="font-sans text-[14px] text-on-surface-variant leading-[1.8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE DEMO / CONTACT SANDBOX FORM — generous vertical padding
          ═══════════════════════════════════════════════════════════════ */}
      <section id="sandbox" className="px-margin-page py-[80px] md:py-[100px] border-b border-outline-variant bg-white">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-[48px] md:gap-[60px] items-center">
          <div className="md:col-span-5 space-y-lg">
            <span className="font-sans text-label-sm text-[11px] uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-sm py-xs border border-emerald-200">
              ⚡ LIVE DEMO SANDBOX
            </span>
            <h2 className="font-serif text-[32px] md:text-[38px] text-primary font-bold leading-tight">
              Test Lead Capture Right Now.
            </h2>
            <p className="font-sans text-[15px] text-on-surface-variant leading-[1.8]">
              Submit a test project inquiry below. Watch how LeadDesk Mini instantly captures it, dispatches email alerts, and populates the agency stream.
            </p>
          </div>

          <div className="md:col-span-7 hairline-border bg-surface-container-low p-[32px] md:p-[40px] shadow-lg">
            <form onSubmit={handleContactSubmit} className="space-y-lg font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <div>
                  <label className="block font-sans text-label-sm text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-sm">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-white border border-outline-variant px-md py-sm font-sans text-[14px] text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-sans text-label-sm text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-sm">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="marcus@techventures.io"
                    className="w-full bg-white border border-outline-variant px-md py-sm font-sans text-[14px] text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <div>
                  <label className="block font-sans text-label-sm text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-sm">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="TechVentures Inc."
                    className="w-full bg-white border border-outline-variant px-md py-sm font-sans text-[14px] text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-sans text-label-sm text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-sm">
                    Project Budget
                  </label>
                  <select
                    value={contactBudget}
                    onChange={(e) => setContactBudget(e.target.value)}
                    className="w-full bg-white border border-outline-variant pl-md pr-10 py-sm font-sans text-[14px] text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                    <option value="$25,000+">$25,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-label-sm text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-sm">
                  Inquiry Message / Scope *
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tell us about your agency design or web development project scope..."
                  className="w-full bg-white border border-outline-variant p-md font-sans text-[14px] text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white font-sans text-label-sm text-[13px] uppercase tracking-widest py-md hover:opacity-90 transition-all font-bold border border-primary shadow-sm"
              >
                {submitting ? "Sending Inquiry..." : "Submit Test Inquiry →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ ACCORDION — generous padding
          ═══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="px-margin-page py-[80px] md:py-[100px] border-b border-outline-variant bg-surface">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-[48px]">
            <span className="font-sans text-label-sm text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70 font-semibold">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-serif text-headline-md text-[36px] text-primary font-bold mt-sm">
              Everything You Need to Know.
            </h2>
          </div>

          <div className="divide-y divide-outline-variant border-t border-b border-outline-variant bg-white hairline-border">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-xl px-2xl text-left hover:bg-surface-container-low transition-colors"
                >
                  <span className="font-serif text-[16px] font-bold text-primary pr-lg">{faq.q}</span>
                  <span
                    className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 shrink-0"
                    style={{ transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-2xl pb-xl font-sans text-[14px] text-on-surface-variant leading-[1.8]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER — spacious
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="px-margin-page py-[60px] bg-surface-container-low">
        <div className="max-w-[1400px] mx-auto space-y-[40px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
            <Brand theme="light" />
            <div className="flex items-center gap-xl font-sans text-[13px] text-on-surface-variant">
              <Link href="/login" className="hover:text-primary transition-colors">Log In</Link>
              <Link href="/register" className="hover:text-primary transition-colors font-bold">Start Free</Link>
              <Link href="/help" className="hover:text-primary transition-colors">Help Center</Link>
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-xl flex flex-col md:flex-row justify-between items-center gap-lg text-[12px] font-sans text-on-surface-variant">
            <p>© {new Date().getFullYear()} LeadDesk Mini. All rights reserved. Capture. Organize. Convert.</p>
            <DigitalHeroesFooter variant="page" />
          </div>
        </div>
      </footer>
    </div>
  );
}
