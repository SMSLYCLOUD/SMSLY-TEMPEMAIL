import { SiteHeader } from "@/components/layout/site-header";
import { InboxView } from "@/components/inbox/inbox-view";

export default function InboxPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-hidden flex flex-col">
        <InboxView />
      </main>
    </div>
  );
}
