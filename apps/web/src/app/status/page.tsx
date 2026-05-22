import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-6 rounded-xl flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold mb-1">All Systems Operational</h2>
              <p className="opacity-90">Last updated: Just now. No current incidents.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Services</h3>

          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {[
              { name: "Web Application (Frontend)", status: "Operational" },
              { name: "REST API", status: "Operational" },
              { name: "SMTP Ingestion", status: "Operational" },
              { name: "SSE Streaming", status: "Operational" },
              { name: "Worker Queue", status: "Operational" },
            ].map((service) => (
              <div key={service.name} className="p-4 flex justify-between items-center bg-card">
                <span className="font-medium">{service.name}</span>
                <span className="text-sm font-medium text-green-500 dark:text-green-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-current block"></span>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
