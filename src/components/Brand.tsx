"use client";

interface BrandProps {
  theme?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
}

export default function Brand({ theme = "dark", className = "", showTagline = false }: BrandProps) {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-xs">
        <span
          className={`font-serif tracking-tight text-[28px] md:text-[34px] leading-tight select-none font-bold ${
            isDark ? "text-white" : "text-primary"
          } ${className}`}
        >
          LeadDesk <span className="font-serif italic text-outline font-normal text-[22px] md:text-[26px]">Mini</span>
        </span>
      </div>
      {showTagline && (
        <span className="font-sans text-[11px] tracking-widest uppercase opacity-60 mt-xs font-medium">
          Capture. Organize. Convert.
        </span>
      )}
    </div>
  );
}
