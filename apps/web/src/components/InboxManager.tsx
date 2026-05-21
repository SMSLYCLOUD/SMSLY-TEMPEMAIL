"use client";

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
