"use client";

import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Trash, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";

interface Message {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyHtml?: string;
  bodyText?: string;
}

export function InboxView({ initialAddress }: { initialAddress?: string }) {
  const [address, setAddress] = useState<string | null>(initialAddress || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(!initialAddress);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Mock initial setup
  useEffect(() => {
    if (!initialAddress) {
      setTimeout(() => {
        setAddress(`test-${Math.floor(Math.random() * 10000)}@tempmail.com`);
        setLoading(false);
      }, 1000);
    }
  }, [initialAddress]);

  // Mock SSE Simulation
  useEffect(() => {
    if (!address) return;
    const timer = setInterval(() => {
      if (Math.random() > 0.8) {
        const newMsg: Message = {
          id: Math.random().toString(36).substring(7),
          from: "noreply@example.com",
          subject: "Your verification code: " + Math.floor(Math.random() * 999999),
          date: new Date().toISOString(),
          snippet: "Please use this code to verify your account...",
          bodyHtml: "<p>Please use this code to verify your account: <strong>123456</strong></p>",
          bodyText: "Please use this code to verify your account: 123456",
        };
        setMessages(prev => [newMsg, ...prev]);
        toast.info("New message received!");
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [address]);

  // Countdown timer
  useEffect(() => {
    if (!address || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [address, timeLeft]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Email address copied to clipboard");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Generating secure inbox...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Ad */}
      <div className="w-full flex justify-center bg-muted/20 border-b border-border py-2 shrink-0">
        <AdSlot slotId="inbox-top" format="horizontal" height={90} className="w-full max-w-[728px]" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="bg-muted px-4 py-2 rounded-lg border border-border flex items-center justify-between flex-1 sm:flex-initial min-w-[250px]">
            <span className="font-mono text-lg font-bold truncate">{address}</span>
            <Button variant="ghost" size="icon" onClick={copyAddress} className="h-8 w-8 ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md border border-border mr-2 text-sm whitespace-nowrap">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTimeLeft(600)}>
            <Plus className="h-4 w-4 mr-2" /> Extend
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.error("Delete not implemented in mock")}>
            <Trash className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Message List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border bg-muted/10 overflow-y-auto ${selectedMessage ? 'hidden md:block' : 'block'}`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <RefreshCw className="h-12 w-12 mb-4 animate-spin opacity-20" />
              <p>Waiting for incoming emails...</p>
              <p className="text-xs mt-2 opacity-50">Auto-refreshes automatically</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg, idx) => (
                <React.Fragment key={msg.id}>
                  <button
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm truncate pr-2">{msg.from}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-1 truncate">{msg.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">{msg.snippet}</div>
                  </button>
                  {/* Inline Ad every 3 messages */}
                  {(idx + 1) % 3 === 0 && (
                     <div className="p-4 bg-muted/30">
                       <AdSlot slotId={`inline-list-${idx}`} format="rectangle" height={100} />
                     </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Message Viewer */}
        <div className={`flex-1 bg-card overflow-hidden flex flex-col ${!selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          {selectedMessage ? (
            <>
              <div className="p-6 border-b border-border shrink-0">
                <Button variant="ghost" size="sm" className="md:hidden mb-4" onClick={() => setSelectedMessage(null)}>
                  &larr; Back to Inbox
                </Button>
                <h2 className="text-2xl font-bold mb-4">{selectedMessage.subject}</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">From: {selectedMessage.from}</div>
                    <div className="text-sm text-muted-foreground">To: {address}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedMessage.date).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950 text-black dark:text-white">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMessage.bodyHtml || `<p>${selectedMessage.bodyText}</p>`) }} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a message to read</p>
            </div>
          )}
        </div>

        {/* Right Sidebar Ad (Desktop only) */}
        <div className="hidden xl:block w-[300px] border-l border-border bg-muted/5 p-4 overflow-y-auto shrink-0">
           <AdSlot slotId="inbox-sidebar" format="vertical" height={600} />
        </div>
      </div>
    </div>
  );
}
