import React from "react";
import { cn } from "@/lib/utils";

interface SponsoredBannerProps {
  title: string;
  description: string;
  url: string;
  ctaText?: string;
  className?: string;
}

export function SponsoredBanner({ title, description, url, ctaText = "Learn More", className }: SponsoredBannerProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]",
        className
      )}
    >
      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
        Sponsored
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <span className="inline-block text-sm font-medium text-primary hover:underline">
        {ctaText} &rarr;
      </span>
    </a>
  );
}
