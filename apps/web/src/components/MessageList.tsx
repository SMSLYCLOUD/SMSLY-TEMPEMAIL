"use client";

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
