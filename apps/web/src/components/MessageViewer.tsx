"use client";

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
