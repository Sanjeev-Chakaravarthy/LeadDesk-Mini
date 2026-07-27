"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyTransactionDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/leads/${resolvedParams.id}`);
    } else {
      router.replace("/leads");
    }
  }, [resolvedParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sans text-body-md text-on-surface-variant">
      Redirecting to lead detail...
    </div>
  );
}
