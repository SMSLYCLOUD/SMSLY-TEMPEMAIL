import { create } from 'zustand';

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
