/**
 * DigitalHeroesFooter
 *
 * Satisfies Digital Heroes trial requirements:
 *   ✓ "Built for Digital Heroes" button → opens https://digitalheroesco.com in a new tab
 *   ✓ rel="noopener noreferrer" on the external link
 *   ✓ Full name: Sanjeev M S
 *   ✓ Email: sanjeev.ms28122@gmail.com
 *   ✓ Responsive (desktop / tablet / mobile via `variant` prop)
 *
 * Usage:
 *   <DigitalHeroesFooter variant="sidebar" />   ← in authenticated sidebar
 *   <DigitalHeroesFooter variant="page" />       ← in public login / register pages
 */

interface DigitalHeroesFooterProps {
  /** "sidebar" renders a compact stacked layout that fits inside the 256px sidebar.
   *  "page" renders a wider centred layout for full-page footers. */
  variant?: "sidebar" | "page";
}

export default function DigitalHeroesFooter({
  variant = "sidebar",
}: DigitalHeroesFooterProps) {
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={`${
        isSidebar
          ? "pt-md border-t border-outline-variant/30"
          : "w-full"
      }`}
      role="contentinfo"
      aria-label="Creator attribution and Digital Heroes partnership"
    >
      {/* ── "Built for Digital Heroes" CTA button ── */}
      <a
        href="https://digitalheroesco.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Built for Digital Heroes — opens digitalheroesco.com in a new tab"
        className={`
          group flex items-center justify-center gap-xs
          bg-primary text-on-primary
          font-sans text-[11px] font-bold uppercase tracking-widest
          transition-all duration-200
          hover:opacity-90 active:scale-[0.97]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          ${isSidebar ? "w-full px-sm py-sm" : "w-full px-xl py-md"}
        `}
      >
        {/* External-link icon (Material Symbols via global font) */}
        <span
          className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-[1px] group-hover:translate-y-[-1px]"
          aria-hidden="true"
        >
          open_in_new
        </span>
        Built for Digital Heroes
      </a>

      {/* ── Creator attribution ── */}
      <div
        className={`${
          isSidebar ? "mt-sm px-xs" : "mt-md text-center"
        } space-y-[3px]`}
      >
        <p
          className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60"
        >
          Created by
        </p>
        <p className="font-sans text-[12px] font-semibold text-primary">
          Sanjeev M S
        </p>
        <a
          href="mailto:sanjeev.ms28122@gmail.com"
          className="font-sans text-[10px] text-on-surface-variant hover:text-primary transition-colors underline underline-offset-2 block break-all"
          aria-label="Send email to Sanjeev M S"
        >
          sanjeev.ms28122@gmail.com
        </a>
      </div>
    </div>
  );
}
