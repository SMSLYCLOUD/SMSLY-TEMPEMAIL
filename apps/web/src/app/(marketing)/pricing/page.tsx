import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdLayout } from "@/components/ads";
import Link from "next/link";

export default function PricingPage() {
  return (
    <AdLayout showBottomAd>
      <div className="py-20 md:py-28 max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your engineering needs. From free disposable testing to enterprise API scale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground">For personal testing and quick validations.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["1 active inbox", "10 minute retention", "Standard domains", "Web UI access", "Ad-supported"].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full h-12">
              <Link href="/inbox">Start Free</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl border-2 border-primary bg-card p-8 shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-muted-foreground">For developers and QA automation teams.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">$15</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "100 active inboxes",
                "30 day retention",
                "Premium domains",
                "API access (1k req/day)",
                "Ad-free experience",
                "Email forwarding"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full h-12">Subscribe to Pro</Button>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-muted-foreground">Custom limits and dedicated infrastructure.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Unlimited inboxes",
                "Custom retention",
                "Custom domains (BYOD)",
                "Unlimited API usage",
                "Dedicated IP addresses",
                "SLA & Priority Support"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full h-12">Contact Sales</Button>
          </div>
        </div>
      </div>
    </AdLayout>
  );
}
