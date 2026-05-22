"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AdProviderType = "adsense" | "internal" | "mock";

interface AdContextProps {
  adsEnabled: boolean;
  provider: AdProviderType;
  adsenseId: string | null;
  adBlockDetected: boolean;
}

const AdContext = createContext<AdContextProps>({
  adsEnabled: false,
  provider: "mock",
  adsenseId: null,
  adBlockDetected: false,
});

export const useAdContext = () => useContext(AdContext);

export function AdSystemProvider({ children }: { children: React.ReactNode }) {
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
  const provider = (process.env.NEXT_PUBLIC_AD_PROVIDER as AdProviderType) || "mock";
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || null;

  useEffect(() => {
    // Basic AdBlock detection (can be expanded later)
    if (!adsEnabled) return;

    const checkAdBlock = () => {
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      document.body.appendChild(testAd);
      window.setTimeout(() => {
        if (testAd.offsetHeight === 0) {
          setAdBlockDetected(true);
        }
        testAd.remove();
      }, 100);
    };

    checkAdBlock();
  }, [adsEnabled]);

  return (
    <AdContext.Provider value={{ adsEnabled, provider, adsenseId, adBlockDetected }}>
      {children}
    </AdContext.Provider>
  );
}
