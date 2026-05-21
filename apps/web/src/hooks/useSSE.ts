"use client";

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
