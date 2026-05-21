"use client";

import { useTempMailStore } from "@/store";
import { useSSE } from "@/hooks/useSSE";
import { InboxManager } from "@/components/InboxManager";
import { MessageList } from "@/components/MessageList";
import { MessageViewer } from "@/components/MessageViewer";

export default function Home() {
  const { inbox } = useTempMailStore();

  useSSE(inbox?.id || null);

  return (
    <main className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">TempMail</h1>
        <p className="text-muted-foreground">Secure, disposable, temporary email</p>
      </div>

      <InboxManager />

      <div className="grid md:grid-cols-[300px_1fr] border rounded-lg overflow-hidden bg-card min-h-[600px]">
        <MessageList />
        <MessageViewer />
      </div>
    </main>
  );
}
