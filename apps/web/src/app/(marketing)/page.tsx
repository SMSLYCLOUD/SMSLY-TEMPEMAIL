import Link from "next/link";
import { ArrowRight, Mail, Shield, Zap, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdLayout, AdSlot, SponsoredBanner } from "@/components/ads";

export default function LandingPage() {
  return (
    <AdLayout showTopAd showBottomAd>
      <div className="flex flex-col items-center pt-24 pb-16 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
          <Zap className="mr-2 h-4 w-4" />
          Enterprise-grade disposable email infrastructure
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-balance bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          The fastest way to test email workflows
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl text-balance">
          Instant, secure, and API-first temporary inboxes for developers and QA teams.
          No registration required for basic use.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Button size="lg" className="h-12 px-8 text-base font-semibold">
            <Link href="/inbox">
              <Mail className="mr-2 h-5 w-5" />
              Generate Random Inbox
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
            <Link href="/api-docs">
              <Terminal className="mr-2 h-5 w-5" />
              View API Docs
            </Link>
          </Button>
        </div>

        {/* Hero Ad Slot */}
        <div className="w-full max-w-3xl mb-24 h-[90px] md:h-[250px] bg-muted/30 rounded-xl overflow-hidden border border-border">
            <AdSlot slotId="hero-ad" format="auto" />
        </div>

        {/* Features Section */}
        <div className="w-full text-left mt-16 mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for modern engineering teams</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">API-First Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automate your testing with our robust REST API. Create inboxes, fetch messages, and stream updates in real-time via SSE.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Messages are stored securely and deleted automatically. Custom retention policies and team isolation for Pro plans.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast UI</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our React-based frontend delivers emails instantly using Server-Sent Events. No manual refreshing required.
              </p>
            </div>
          </div>
        </div>

        {/* Mid-page Ad and Sponsor */}
        <div className="w-full grid md:grid-cols-2 gap-8 mb-24">
            <SponsoredBanner
              title="Cloud Infrastructure by DigitalOcean"
              description="Get $200 in free credit to build, deploy, and scale your applications quickly."
              url="https://digitalocean.com"
              ctaText="Claim Offer"
            />
            <div className="h-[150px] bg-muted/30 rounded-xl overflow-hidden border border-border">
                <AdSlot slotId="mid-page" format="horizontal" />
            </div>
        </div>

        {/* CTA Section */}
        <div className="w-full rounded-3xl bg-primary/5 border border-primary/20 p-12 text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to scale your testing?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers using TempMail Enterprise for their QA and automation needs.
          </p>
          <Button size="lg" className="h-12 px-8">
            <Link href="/pricing">View Pricing <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </AdLayout>
  );
}
