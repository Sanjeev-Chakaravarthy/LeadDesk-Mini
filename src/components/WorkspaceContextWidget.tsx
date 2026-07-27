"use client";

import React from "react";

export default function WorkspaceContextWidget() {
  return (
    <div className="bg-[#F5F5F5] border border-outline-variant/50 p-xl flex flex-col w-full font-sans">
      {/* Header */}
      <div className="mb-lg">
        <h3 className="text-[12px] font-bold tracking-wider text-primary uppercase mb-1">
          Lead Sync Engine
        </h3>
        <p className="text-[13px] text-on-surface-variant font-mono">
          ENDPOINT: active-lead-stream-v1
        </p>
      </div>

      <div className="border-t border-outline-variant/30 w-full mb-lg"></div>

      {/* Status Items */}
      <div className="space-y-md mb-2xl">
        <div className="flex justify-between items-center">
          <span className="text-[13px] font-semibold text-primary">Capture Status</span>
          <span className="text-[11px] font-mono bg-surface-container-high px-2 py-1 text-primary">
            LISTENING
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[13px] font-semibold text-primary">Pipeline Health</span>
          <span className="text-[12px] font-mono text-[#3BAA76]">
            OPTIMAL (100%)
          </span>
        </div>
      </div>

      {/* Graphic Area */}
      <div className="relative w-full h-[200px] bg-gradient-to-br from-[#E8E8E8] to-[#D8D8D8] mb-2xl overflow-hidden flex items-end p-md border border-outline-variant/20 shadow-inner">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full bg-gradient-to-tr from-black/5 to-transparent"></div>
          <div className="w-1/2 h-full bg-gradient-to-tl from-black/10 to-transparent"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col gap-xs">
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary/80 uppercase">
            Agency CRM Perimeter
          </span>
          <span className="text-[12px] font-serif text-primary font-bold">
            Real-time Lead Capture & Qualification
          </span>
        </div>
      </div>

      {/* Storage & Lead Limit Box */}
      <div className="border border-outline-variant/40 bg-white p-md flex flex-col gap-sm">
        <h4 className="text-[12px] font-bold text-primary">Monthly Lead Allowance</h4>
        <div className="w-full h-[3px] bg-[#E3E3E3] mt-1 relative">
          <div className="absolute left-0 top-0 h-full w-[12%] bg-primary"></div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-on-surface-variant font-medium">UNLIMITED CAPTURE</span>
          <span className="text-[11px] text-on-surface-variant font-mono font-medium">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
