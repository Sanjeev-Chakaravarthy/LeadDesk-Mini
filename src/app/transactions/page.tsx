"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyTransactionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/leads");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sans text-body-md text-on-surface-variant">
      Redirecting to Lead Desk...
    </div>
  );
}
