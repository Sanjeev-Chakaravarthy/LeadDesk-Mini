"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { authClient } from "@/utils/auth-client";

export default function HowItWorks() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("Loading...");

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res.data?.session) {
        router.push("/login");
      } else {
        fetch("/api/workspace/stats")
          .then((res) => res.json())
          .then((data) => {
            if (data.workspaceName) {
              setWorkspaceName(data.workspaceName);
            }
          })
          .catch(() => {});
      }
    });
  }, [router]);

  const steps = [
    { title: "Website Lead Capture", desc: "Website visitor submits inquiry form on your agency site or via API endpoint." },
    { title: "Session & Org Verification", desc: "Backend validates cryptographic token and binds incoming lead to your agency workspace." },
    { title: "Real-time Notification", desc: "LeadDesk Mini alerts team members and streams lead into your active agency dashboard." },
    { title: "Pipeline Scoping", desc: "Prisma database queries execute with explicit organization scoping, ensuring total data privacy." },
    { title: "Qualify & Convert", desc: "Teammates update pipeline status (New → Contacted → Closed) and log client contract notes." },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow w-full px-margin-page py-3xl max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-xl md:gap-3xl">
          {/* Left Meta Column */}
          <aside className="col-span-1 md:col-span-3 lg:col-span-4 flex flex-col gap-lg hidden md:flex pt-sm">
            <div className="border-t border-primary pt-sm">
              <h3 className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mb-base font-semibold">
                Agency Workspace
              </h3>
              <p className="font-mono text-[13px] text-primary font-bold">{workspaceName}</p>
            </div>
            <div className="border-t border-outline-variant pt-sm">
              <h3 className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mb-base font-semibold">
                Document Scope
              </h3>
              <p className="font-mono text-[13px] text-primary">Lead Engine Architecture</p>
            </div>
            <div className="border-t border-outline-variant pt-sm">
              <h3 className="font-sans text-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mb-base font-semibold">
                Security Perimeter
              </h3>
              <p className="font-mono text-[13px] text-primary">Multi-tenant Workspace Scoping</p>
            </div>
          </aside>

          {/* Right Content Column */}
          <article className="col-span-1 md:col-span-9 lg:col-span-8 flex flex-col">
            <h1 className="font-serif text-display-lg text-[40px] leading-tight text-primary mb-xl font-bold">
              How LeadDesk Mini Works — Lead Stream Architecture
            </h1>

            <div className="font-sans text-[16px] text-on-surface-variant leading-relaxed max-w-[65ch] space-y-md mb-2xl">
              <p>
                LeadDesk Mini employs a strict perimeter-based approach to agency lead management and data isolation. Every inquiry is cryptographically scoped to your agency organization before any lead data is stored or queried.
              </p>
              <p>
                The execution flow below outlines the deterministic lifecycle of an incoming website inquiry. This sequence ensures no competitor or unauthorized party can access your client pipeline.
              </p>
            </div>

            <div className="border-t border-outline-variant w-full my-lg"></div>

            {/* Vertical Flow Diagram */}
            <section className="flex flex-col items-start w-full max-w-2xl py-lg">
              {steps.map((step, idx) => (
                <div key={step.title} className="w-full flex flex-col">
                  {/* Node */}
                  <div className="w-full border border-outline-variant bg-white p-lg hover:bg-surface-container-low transition-colors duration-200">
                    <div className="flex items-center gap-sm">
                      <span className="font-mono text-[12px] bg-primary text-white w-6 h-6 flex items-center justify-center font-bold">
                        0{idx + 1}
                      </span>
                      <span className="font-sans text-[14px] text-primary font-bold uppercase tracking-wider">
                        {step.title}
                      </span>
                    </div>
                    <p className="font-sans text-body-md text-[13px] text-on-surface-variant mt-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Edge (if not last) */}
                  {idx < steps.length - 1 && (
                    <div className="w-full flex pl-lg py-xs">
                      <div className="w-px h-lg bg-outline-variant relative">
                        <span className="material-symbols-outlined text-[14px] text-outline-variant absolute -bottom-[10px] -left-[6.5px]">
                          arrow_drop_down
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <div className="border-t border-outline-variant w-full my-2xl"></div>

            <div className="font-sans text-body-md text-[13px] text-on-surface-variant max-w-[65ch]">
              <h4 className="font-sans text-label-sm text-[12px] text-primary uppercase tracking-widest mb-sm font-semibold">
                Technical Note
              </h4>
              <p className="opacity-80">
                Workspace scoping is enforced at both the API handler and database query layers. Under no circumstances can lead IDs or workspace boundaries be tampered with via user payloads.
              </p>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
