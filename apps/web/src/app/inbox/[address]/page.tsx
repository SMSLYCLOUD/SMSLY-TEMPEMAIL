import { SiteHeader } from "@/components/layout/site-header";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxAddressPage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = await params;
  const address = decodeURIComponent(resolvedParams.address);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-hidden flex flex-col">
        <InboxView initialAddress={address} />
      </main>
    </div>
  );
}
