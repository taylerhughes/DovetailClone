"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Citation = {
  subjectType: "NOTE" | "HIGHLIGHT" | "INSIGHT";
  subjectId: string;
  sourceTitle: string;
  href: string;
};

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; citations: Citation[] };

const MAX_HISTORY_TURNS = 6;

export function AskResearchChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const history = nextMessages
        .slice(-MAX_HISTORY_TURNS * 2, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to get an answer");
        setQuestion(trimmed);
        setMessages(messages);
        return;
      }
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.answer, citations: data.citations ?? [] },
      ]);
    } catch {
      toast.error("Failed to get an answer");
      setQuestion(trimmed);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask a question about your research repository — answers are drawn only
            from your notes, highlights, and insights, with citations back to the
            source.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              {m.content}
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.citations.length > 0 && (
                <div className="flex flex-col gap-1 border-t pt-2">
                  {m.citations.map((c) => (
                    <Link
                      key={`${c.subjectType}:${c.subjectId}`}
                      href={c.href}
                      className="line-clamp-1 text-xs text-primary hover:underline"
                    >
                      {c.sourceTitle}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {loading && <p className="text-sm text-muted-foreground">Thinking…</p>}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
          placeholder="Ask your research…"
          className="min-h-10 flex-1 resize-none"
        />
        <Button disabled={loading || !question.trim()} onClick={handleAsk}>
          <Sparkles data-icon="inline-start" />
          Ask
        </Button>
      </div>
    </div>
  );
}
