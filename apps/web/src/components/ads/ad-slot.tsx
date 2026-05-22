"use client";

import React, { useEffect, useRef } from "react";
import { useAdContext } from "./ad-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  slotId: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function AdSlot({ slotId, format = "auto", className, width, height }: AdSlotProps) {
  const { adsEnabled, provider, adsenseId } = useAdContext();
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (provider === "adsense" && adsEnabled && adsenseId && !initialized.current && adRef.current) {
      try {
        // @ts-expect-error Google AdSense injects adsbygoogle
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (err) {
        console.error("AdSense initialization failed", err);
      }
    }
  }, [provider, adsEnabled, adsenseId]);

  if (!adsEnabled) return null;

  if (provider === "mock") {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted border border-border text-muted-foreground text-xs p-4 overflow-hidden rounded", className)}
        style={{ width: width || "100%", height: height || "100%" }}
      >
        <span className="opacity-50">[MOCK AD SLOT: {slotId}]</span>
      </div>
    );
  }

  if (provider === "internal") {
    return (
      <div
        className={cn("flex items-center justify-center bg-primary/10 border border-primary/20 text-primary p-4 overflow-hidden rounded", className)}
        style={{ width: width || "100%", height: height || "100%" }}
      >
        <span className="font-semibold text-sm">Sponsored by TempMail Enterprise</span>
      </div>
    );
  }

  if (provider === "adsense" && adsenseId) {
    return (
      <div className={cn("overflow-hidden rounded", className)} style={{ width: width || "100%", height: height || "100%" }}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client={adsenseId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return <Skeleton className={cn("w-full h-full", className)} />;
}
