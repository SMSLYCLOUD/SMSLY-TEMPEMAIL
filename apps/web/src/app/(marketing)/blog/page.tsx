import { AdLayout, AdSlot } from "@/components/ads";
import Link from "next/link";

export default function BlogPage() {
  return (
    <AdLayout showSidebarAd>
      <div className="py-16 md:py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Engineering Blog</h1>
        <p className="text-xl text-muted-foreground mb-16">
          Insights on infrastructure, email protocols, and scaling SaaS applications.
        </p>

        <div className="space-y-12">
          {/* Mock Article 1 */}
          <article className="group relative flex flex-col items-start justify-between">
            <div className="flex items-center gap-x-4 text-xs mb-4">
              <time dateTime="2023-10-25" className="text-muted-foreground">Oct 25, 2023</time>
              <span className="relative z-10 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">Architecture</span>
            </div>
            <div className="group relative">
              <h3 className="mt-3 text-2xl font-semibold leading-6 text-foreground group-hover:text-primary transition-colors">
                <Link href="/blog/scaling-go-smtp-servers">
                  <span className="absolute inset-0"></span>
                  Scaling Go SMTP Servers to 10k messages per second
                </Link>
              </h3>
              <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                How we redesigned our ingestion pipeline using Go channels and Redis to handle massive spikes in disposable email traffic without dropping connections or triggering rate limits on upstream providers.
              </p>
            </div>
          </article>

          <div className="my-8 py-4 border-y border-border">
            <AdSlot slotId="blog-inline-1" format="horizontal" height={120} />
          </div>

          {/* Mock Article 2 */}
          <article className="group relative flex flex-col items-start justify-between">
            <div className="flex items-center gap-x-4 text-xs mb-4">
              <time dateTime="2023-09-12" className="text-muted-foreground">Sep 12, 2023</time>
              <span className="relative z-10 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">Frontend</span>
            </div>
            <div className="group relative">
              <h3 className="mt-3 text-2xl font-semibold leading-6 text-foreground group-hover:text-primary transition-colors">
                <Link href="/blog/real-time-ui-with-sse">
                  <span className="absolute inset-0"></span>
                  Building a real-time UI with Server-Sent Events (SSE) in Next.js 15
                </Link>
              </h3>
              <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                Why we chose SSE over WebSockets for our inbox streaming architecture, and how React Server Components combined with streaming responses create a blazingly fast UX.
              </p>
            </div>
          </article>
        </div>
      </div>
    </AdLayout>
  );
}
