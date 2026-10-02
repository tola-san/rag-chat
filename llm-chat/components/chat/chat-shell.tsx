"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, MessageSquare, PanelLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage, type ChatMessage } from "@/lib/api";

const STORAGE_KEY = "hotmes-ai-chats-v1";
const EMPTY_MESSAGES: ChatMessage[] = [];

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface StoredChatState {
  conversations: Conversation[];
  activeId: string;
}

// const suggestions = [
//   "Explain REST APIs in simple terms",
//   "Write a TypeScript debounce function",
//   "Give me three ideas for a weekend project",
// ];

const createConversation = (): Conversation => {
  const now = Date.now();
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random()}`,
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

const initialConversation: Conversation = {
  id: "initial-chat",
  title: "New chat",
  messages: [],
  createdAt: 0,
  updatedAt: 0,
};


// function to generate a conversation title based on the first user message, truncated to 42 characters

const getConversationTitle = (question: string) =>

 // shortens the question to 48 characters and adds an ellipsis if it's longer than that
  question.length > 48 ? `${question.slice(0, 48).trim()}…` : question;



// type Guard<T> = (value: unknown) => value is T;
const isStoredChatState = (value: unknown): value is StoredChatState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<StoredChatState>;
  return (
    typeof state.activeId === "string" &&
    Array.isArray(state.conversations) &&
    state.conversations.every(
      (conversation) =>
        conversation &&
        typeof conversation.id === "string" &&
        typeof conversation.title === "string" &&
        typeof conversation.createdAt === "number" &&
        typeof conversation.updatedAt === "number" &&
        Array.isArray(conversation.messages) &&
        conversation.messages.every(
          (message: ChatMessage) =>
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string"
        )
    )
  );
};

export function ChatShell() {
  const [conversations, setConversations] = useState<Conversation[]>([initialConversation]);
  const [activeId, setActiveId] = useState(initialConversation.id);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? EMPTY_MESSAGES;


  //  loading chat history from localStorage on initial render
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isStoredChatState(parsed) && parsed.conversations.length > 0) {
            setConversations(parsed.conversations);
            setActiveId(
              parsed.conversations.some(({ id }) => id === parsed.activeId)
                ? parsed.activeId
                : parsed.conversations[0].id
            );
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHasLoadedHistory(true);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);


  // saving chat history to localStorage whenever conversations or activeId change
  useEffect(() => {
    if (!hasLoadedHistory) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversations, activeId } satisfies StoredChatState)
      );
    } catch {
      // Keep the in-memory chat usable if browser storage is unavailable or full.
    }
  }, [activeId, conversations, hasLoadedHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, error]);

  const updateConversation = (
    conversationId: string,
    update: (conversation: Conversation) => Conversation
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? update(conversation) : conversation
      )
    );
  };

  const submitMessage = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending || !activeConversation) return;

    const conversationId = activeConversation.id;
    const history = activeConversation.messages;

    
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.messages.length === 0
          ? getConversationTitle(trimmedQuestion)
          : conversation.title,
      messages: [...conversation.messages, { role: "user", content: trimmedQuestion }],
      updatedAt: Date.now(),
    }));


    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const answer = await sendChatMessage(trimmedQuestion, history);
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, { role: "assistant", content: answer }],
        updatedAt: Date.now(),
      }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The request could not be completed."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(draft);
    }
  };

  const startNewChat = () => {
    const existingEmptyChat = conversations.find(
      (conversation) => conversation.messages.length === 0
    );
    if (existingEmptyChat) {
      setActiveId(existingEmptyChat.id);
    } else {
      const conversation = createConversation();
      setConversations((current) => [conversation, ...current]);
      setActiveId(conversation.id);
    }
    setDraft("");
    setError(null);
    setIsHistoryOpen(false);
  };

  const selectChat = (conversationId: string) => {
    setActiveId(conversationId);
    setDraft("");
    setError(null);
    setIsHistoryOpen(false);
  };

  const deleteChat = (conversationId: string) => {
    const remaining = conversations.filter(({ id }) => id !== conversationId);
    if (remaining.length === 0) {
      const conversation = createConversation();
      setConversations([conversation]);
      setActiveId(conversation.id);
    } else {
      setConversations(remaining);
      if (activeId === conversationId) setActiveId(remaining[0].id);
    }
    setError(null);
  };

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="relative flex h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-[-10%] top-[-5rem] h-96 origin-top bg-[radial-gradient(ellipse_at_top,oklch(0.82_0.14_250/0.95),oklch(0.88_0.10_300/0.65)_42%,transparent_75%)] blur-xl animate-[ambient-glow_10s_ease-in-out_infinite] motion-reduce:animate-none dark:bg-[radial-gradient(ellipse_at_top,oklch(0.48_0.16_255/0.85),oklch(0.38_0.12_300/0.55)_42%,transparent_75%)]" />

      {isHistoryOpen && (
        <button
          type="button"
          aria-label="Close chat history"
          className="fixed inset-0 z-20 bg-black/25 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border/70 bg-zinc-50/50 p-3 shadow-xl backdrop-blur-xl transition-transform duration-200 md:relative md:z-10 md:w-64 md:translate-x-0 md:shadow-none lg:w-72 ${
          isHistoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-13 items-center gap-2 px-1">
          <div className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
            <Sparkles aria-hidden="true" className="size-4.5" strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold tracking-tight">HotMes-Ai</p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={startNewChat}
          disabled={isSending}
          className="mt-3 w-full justify-start gap-2 bg-card/70"
        >
          <Plus aria-hidden="true" className="size-4" />
          New chat
        </Button>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            History
          </p>
          <nav className="mt-2 flex-1 space-y-1 overflow-y-auto" aria-label="Chat history">
            {sortedConversations.map((conversation) => (
              <div key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => selectChat(conversation.id)}
                  disabled={isSending}
                  aria-current={conversation.id === activeId ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 pr-9 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                    conversation.id === activeId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <MessageSquare aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{conversation.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteChat(conversation.id)}
                  disabled={isSending}
                  aria-label={`Delete ${conversation.title}`}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground opacity-100 transition hover:bg-background hover:text-destructive focus:opacity-100 disabled:cursor-not-allowed md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-zinc-50/50 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Open chat history"
              className="md:hidden"
            >
              <PanelLeft aria-hidden="true" className="size-4.5" />
            </Button>
            <p className="min-w-0 truncate text-sm font-medium">
              {activeConversation?.title ?? "New chat"}
            </p>
          </div>
        </header>

        <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
          <div className="flex flex-1 flex-col overflow-y-auto py-8 sm:py-12" aria-live="polite">
            {messages.length === 0 ? (
              <div className="m-auto flex w-full max-w-2xl flex-col items-center py-12 text-center">
                <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  What can I help you think through?
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                  Ask a question, explore an idea, or get help with code. This chat
                  will be saved in your history on this device.
                </p>

                {/* <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void submitMessage(suggestion)}
                      className="rounded-sm border border-border/80 bg-card/70 px-4 py-3 text-left text-sm leading-5 shadow-[0_1px_2px_oklch(0_0_0/0.04)] transition-[border-color,background-color,transform] duration-150 hover:border-foreground/20 hover:bg-card active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div> */}
              </div>
            ) : (
              <div className="space-y-7">
                {messages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm border bg-card shadow-sm">
                        <Bot aria-hidden="true" className="size-4" strokeWidth={1.7} />
                      </div>
                    )}

                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[82%] rounded-sm bg-primary px-4 py-2 text-sm leading-6 text-primary-foreground shadow-sm"
                          : "min-w-0 max-w-[88%] pt-1 text-sm leading-7 sm:text-[15px]"
                      }
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                            code: ({ children }) => <code className="rounded-md bg-zinc-50 px-1.5 py-0.5 font-mono text-[0.86em] dark:bg-zinc-800">{children}</code>,
                            pre: ({ children }) => <pre className="mb-3 overflow-x-auto rounded-md border bg-zinc-50 p-4 text-xs leading-6 last:mb-0 dark:bg-zinc-900">{children}</pre>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </article>
                ))}

                {isSending && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex size-8 items-center justify-center rounded-sm border bg-card shadow-sm">
                      <Bot aria-hidden="true" className="size-4" strokeWidth={1.7} />
                    </div>
                    <div className="flex items-center gap-1.5" aria-label="Gemini is thinking">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
                          style={{ animationDelay: `${dot * 120}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="ml-11 rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8 sm:pb-6">
            <form
              onSubmit={handleSubmit}
              className="rounded-sm border border-border/80 bg-card p-2 shadow-[0_1px_2px_oklch(0_0_0/0.08),0_14px_40px_oklch(0_0_0/0.09)]"
            >
              <label htmlFor="chat-message" className="sr-only">Message HotMes Ai</label>
              <Textarea
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message HotMes Ai...."
                disabled={isSending}
                rows={2}
                className="max-h-40 min-h-14 resize-none border-0 bg-transparent px-2.5 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <div className="flex items-center justify-between gap-3 px-1 pt-1">
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Enter to send · Shift + Enter for a new line
                </p>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || isSending}
                  aria-label="Send message"
                  className="ml-auto rounded-sm transition-[background-color,transform] duration-150 active:scale-96"
                >
                  <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2} />
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
