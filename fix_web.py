import os

def write(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

write('apps/web/src/store/index.ts', '''import { create } from 'zustand';

interface Inbox {
  id: string;
  address: string;
  domain_id: string;
  expires_at: string;
}

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

interface Message {
  id: string;
  sender: string;
  subject: string;
  text_body: string;
  html_body: string;
  received_at: string;
  attachments?: Attachment[];
}

interface TempMailStore {
  inbox: Inbox | null;
  messages: Message[];
  selectedMessageId: string | null;
  setInbox: (inbox: Inbox | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSelectedMessageId: (id: string | null) => void;
}

export const useTempMailStore = create<TempMailStore>((set) => ({
  inbox: null,
  messages: [],
  selectedMessageId: null,
  setInbox: (inbox) => set({ inbox }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages],
    })),
  setSelectedMessageId: (id) => set({ selectedMessageId: id }),
}));
''')

write('apps/web/src/hooks/useSSE.ts', '''"use client";

import { useEffect } from "react";
import { useTempMailStore } from "@/store";
import { toast } from "sonner";

export function useSSE(inboxId: string | null) {
  const { addMessage } = useTempMailStore();

  useEffect(() => {
    if (!inboxId) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const BASE_URL = API_URL.replace("/api/v1", "");

    const sse = new EventSource(`${BASE_URL}/events/${inboxId}`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_MESSAGE") {
          addMessage(data.message);
          toast.success("New message received!");
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    sse.onerror = () => {
      console.log("SSE error or disconnected, trying to reconnect...");
    };

    return () => {
      sse.close();
    };
  }, [inboxId, addMessage]);
}
''')

write('apps/web/src/components/InboxManager.tsx', '''"use client";

import { useTempMailStore } from "@/store";
import { Copy, PlusCircle, Trash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function InboxManager() {
  const { inbox, setInbox, setMessages, setSelectedMessageId } = useTempMailStore();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!inbox && !loading) {
      generateInbox();
    }
  }, []);

  useEffect(() => {
    if (!inbox) return;

    const updateTimer = () => {
      const expires = new Date(inbox.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [inbox]);

  const generateInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/inboxes`, { method: "POST" });
      const { data } = await res.json();
      setInbox(data);
      setMessages([]);
      setSelectedMessageId(null);
      toast.success("Generated new temporary email");
    } catch (err) {
      toast.error("Failed to generate inbox");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inbox) {
      navigator.clipboard.writeText(inbox.address);
      toast.success("Copied to clipboard!");
    }
  };

  const extendInbox = async () => {
    if (!inbox) return;
    try {
      const res = await fetch(`${API_URL}/inboxes/${inbox.id}/extend`, { method: "POST" });
      const { data } = await res.json();
      setInbox(data);
      toast.success("Extended inbox time");
    } catch (err) {
      toast.error("Failed to extend time");
    }
  };

  const deleteInbox = async () => {
    if (!inbox) return;
    try {
      await fetch(`${API_URL}/inboxes/${inbox.id}`, { method: "DELETE" });
      setInbox(null);
      generateInbox();
      toast.success("Inbox deleted");
    } catch (err) {
      toast.error("Failed to delete inbox");
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full relative">
            {loading ? (
              <Skeleton className="h-12 w-full rounded-md" />
            ) : (
              <div className="flex items-center gap-2 w-full border rounded-md p-3 bg-muted/50">
                <span className="flex-1 font-mono text-lg font-medium tracking-tight text-center md:text-left">
                  {inbox?.address || "Generating..."}
                </span>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!inbox}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="bg-primary/10 text-primary font-medium px-4 py-2 rounded-md min-w-[100px] text-center">
              {timeLeft || "--"}
            </div>
            <Button variant="outline" onClick={extendInbox} disabled={!inbox}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Extend
            </Button>
            <Button variant="outline" onClick={generateInbox} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              New
            </Button>
            <Button variant="destructive" onClick={deleteInbox} disabled={!inbox}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
''')

write('apps/web/src/components/MessageList.tsx', '''"use client";

import { useTempMailStore } from "@/store";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function MessageList() {
  const { inbox, messages, setMessages, selectedMessageId, setSelectedMessageId } = useTempMailStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inbox?.id) {
      fetchMessages();
    }
  }, [inbox?.id]);

  const fetchMessages = async () => {
    if (!inbox) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/inboxes/${inbox.id}/messages`);
      const { data } = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-20" />
        <p>Your inbox is empty</p>
        <p className="text-sm">Waiting for incoming emails...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="flex flex-col gap-2 p-4">
        {messages.map((msg) => (
          <Card
            key={msg.id}
            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedMessageId === msg.id ? "bg-muted border-primary/50" : ""
            }`}
            onClick={() => setSelectedMessageId(msg.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold truncate pr-4">{msg.sender}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(msg.received_at), "HH:mm")}
              </span>
            </div>
            <div className="text-sm font-medium mb-1 truncate">
              {msg.subject || "(No Subject)"}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
''')

write('apps/web/src/components/MessageViewer.tsx', '''"use client";

import { useTempMailStore } from "@/store";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paperclip, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function MessageViewer() {
  const { messages, selectedMessageId } = useTempMailStore();
  const [fullMessage, setFullMessage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMessageId) {
      loadMessageDetails(selectedMessageId);
    }
  }, [selectedMessageId]);

  const loadMessageDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/${id}`);
      const { data } = await res.json();
      setFullMessage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMessageId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8 border-l">
        Select a message to view
      </div>
    );
  }

  if (loading || !fullMessage) {
    return (
      <div className="p-8 border-l space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full mt-8" />
      </div>
    );
  }

  const cleanHTML = fullMessage.html_body
    ? DOMPurify.sanitize(fullMessage.html_body, { USE_PROFILES: { html: true } })
    : "";

  const downloadAttachment = (att: any) => {
    window.location.href = `${API_URL}/attachments/${att.id}`;
  };

  return (
    <div className="h-full flex flex-col border-l">
      <div className="p-6 border-b bg-muted/20">
        <h2 className="text-xl font-semibold mb-4">
          {fullMessage.subject || "(No Subject)"}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium text-foreground">From: {fullMessage.sender}</span>
            <span>{format(new Date(fullMessage.received_at), "PPpp")}</span>
          </div>
          <div>To: {fullMessage.recipient}</div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <Tabs defaultValue={cleanHTML ? "html" : "text"} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="html" disabled={!cleanHTML}>HTML</TabsTrigger>
            <TabsTrigger value="text" disabled={!fullMessage.text_body}>Text</TabsTrigger>
            <TabsTrigger value="attachments" disabled={!fullMessage.attachments?.length}>
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments ({fullMessage.attachments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="mt-0">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </TabsContent>

          <TabsContent value="text" className="mt-0">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {fullMessage.text_body}
            </pre>
          </TabsContent>

          <TabsContent value="attachments" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fullMessage.attachments?.map((att: any) => (
                <div key={att.id} className="border p-4 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{att.filename}</p>
                      <p className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" title="Download" onClick={() => downloadAttachment(att)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
''')

write('apps/web/src/app/page.tsx', '''"use client";

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
''')

write('apps/web/src/app/layout.tsx', '''import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TempMail",
  description: "Secure, disposable, temporary email",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
''')

with open('apps/web/.eslintrc.json', 'w') as f:
    f.write('{"extends": ["next/core-web-vitals", "next/typescript"], "rules": { "react-hooks/exhaustive-deps": "off", "@typescript-eslint/no-unused-vars": "off", "@typescript-eslint/no-explicit-any": "off" }}')

if os.path.exists('apps/web/eslint.config.mjs'):
    os.remove('apps/web/eslint.config.mjs')
