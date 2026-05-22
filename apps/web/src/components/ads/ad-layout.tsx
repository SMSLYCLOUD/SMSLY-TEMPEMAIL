import React from "react";
import { AdSlot } from "./ad-slot";

interface AdLayoutProps {
  children: React.ReactNode;
  showSidebarAd?: boolean;
  showTopAd?: boolean;
  showBottomAd?: boolean;
}

export function AdLayout({ children, showSidebarAd = false, showTopAd = false, showBottomAd = false }: AdLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto px-4">
      <div className="flex-1 flex flex-col min-w-0">
        {showTopAd && (
          <div className="mb-6 w-full flex justify-center">
            <AdSlot slotId="top-banner" format="horizontal" height={90} className="w-full max-w-[728px]" />
          </div>
        )}

        <main>{children}</main>

        {showBottomAd && (
          <div className="mt-6 w-full flex justify-center sticky bottom-4 z-10 lg:static lg:bottom-auto">
            <AdSlot slotId="bottom-banner" format="horizontal" height={50} className="w-full max-w-[320px] lg:max-w-[728px] shadow-lg rounded-lg border border-border bg-background" />
          </div>
        )}
      </div>

      {showSidebarAd && (
        <aside className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">
          <div className="sticky top-6">
            <AdSlot slotId="sidebar-1" format="vertical" height={600} />
          </div>
        </aside>
      )}
    </div>
  );
}
