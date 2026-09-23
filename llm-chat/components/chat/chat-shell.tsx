"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, RotateCcw, Sparkles, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage, type ChatMessage } from "@/lib/api";

const suggestions = [
  "Explain REST APIs in simple terms",
  "Write a TypeScript debounce function",
  "Give me three ideas for a weekend project",
];

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, error]);

  const submitMessage = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) return;

    const history = messages;
    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedQuestion },
    ]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const answer = await sendChatMessage(trimmedQuestion, history);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);
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

  const resetChat = () => {
    setMessages([]);
    setDraft("");
    setError(null);
  };

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
    <div className="pointer-events-none absolute inset-x-[-10%] top-[-5rem] h-96 origin-top bg-[radial-gradient(ellipse_at_top,oklch(0.82_0.14_250/0.95),oklch(0.88_0.10_300/0.65)_42%,transparent_75%)] blur-xl animate-[ambient-glow_10s_ease-in-out_infinite] motion-reduce:animate-none dark:bg-[radial-gradient(ellipse_at_top,oklch(0.48_0.16_255/0.85),oklch(0.38_0.12_300/0.55)_42%,transparent_75%)]" />

      <header className="relative z-10 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.18),0_6px_16px_oklch(0_0_0/0.08)]">
              <Sparkles aria-hidden="true" className="size-4.5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">HotMes-Ai</p>
              
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetChat}
              className="gap-1.5 active:scale-96 border border-gray-100"
            >
              <RotateCcw aria-hidden="true" className="size-3.5 " strokeWidth={1.8} />
              New chat
            </Button>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
        <div
          className="flex flex-1 flex-col overflow-y-auto py-8 sm:py-12"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="m-auto flex w-full max-w-2xl flex-col items-center py-12 text-center">
             
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                What can I help you think through?
              </h1>
              <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Ask a question, explore an idea, or get help with code. Your request
                is sent securely through the local api-ai service.
              </p>

              <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void submitMessage(suggestion)}
                    className="rounded-lg border border-border/80 bg-card/70 px-4 py-3 text-left text-sm leading-5 shadow-[0_1px_2px_oklch(0_0_0/0.04)] transition-[border-color,background-color,transform] duration-150 hover:border-foreground/20 hover:bg-card active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card shadow-sm">
                      <Bot aria-hidden="true" className="size-4" strokeWidth={1.7} />
                    </div>
                  )}

                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[82%] rounded-xl rounded bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground shadow-sm"
                        : "min-w-0 max-w-[88%] pt-1 text-sm leading-7 sm:text-[15px]"
                    }
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          ul: ({ children }) => (
                            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                          ),
                          code: ({ children }) => (
                            <code className="rounded-xl bg-muted px-1.5 py-0.5 font-mono text-[0.86em]">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="mb-3 overflow-x-auto rounded-xl border bg-muted/60 p-4 text-xs leading-6 last:mb-0">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <UserRound aria-hidden="true" className="size-4" strokeWidth={1.7} />
                    </div>
                  )}
                </article>
              ))}

              {isSending && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-card shadow-sm">
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
                <div className="ml-11 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8 sm:pb-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/80 bg-card p-2 shadow-[0_1px_2px_oklch(0_0_0/0.08),0_14px_40px_oklch(0_0_0/0.09)]"
          >
            <label htmlFor="chat-message" className="sr-only">
              Message Hotmes ai
            </label>
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
              <div className="ml-auto flex items-center gap-2">
                
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || isSending}
                  aria-label="Send message"
                  className="rounded-xl transition-[background-color,transform] duration-150 active:scale-96"
                >
                  <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          </form>
         
        </div>
      </section>
    </main>
  );
}
