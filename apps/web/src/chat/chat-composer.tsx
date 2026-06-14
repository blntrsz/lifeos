import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { Send } from "lucide-react";
import { forwardRef, useEffect, useRef } from "react";

import * as ChatAtoms from "@/chat/chat.atoms";
import { Button } from "@/components/ui/button";

function isDesktop() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

type ComposerInputProps = {
  readonly text: string;
  readonly onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onSend: () => void;
  readonly canSend: boolean;
};

export const ComposerInput = forwardRef<HTMLTextAreaElement, ComposerInputProps>(
  ({ text, onChange, onKeyDown, onSend, canSend }, ref) => {
    return (
      <div className="flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <textarea
          ref={ref}
          className="max-h-40 min-h-[3rem] flex-1 resize-none bg-transparent px-3 py-2 text-foreground outline-none"
          placeholder="What would you like to focus on?"
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <Button size="icon" disabled={!canSend} onClick={onSend} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </div>
    );
  },
);
ComposerInput.displayName = "ComposerInput";

export function ChatComposer() {
  const state = useAtomValue(ChatAtoms.composerState);
  const sendResult = useAtomValue(ChatAtoms.sendFirstMessage);
  const [, setComposerText] = useAtom(ChatAtoms.composerText);
  const send = useAtomSet(ChatAtoms.sendFirstMessage, { mode: "promise" });
  const resetComposerSession = useAtomSet(ChatAtoms.resetComposerSession);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (navigate !== null && AsyncResult.isSuccess(sendResult)) {
      const chat = sendResult.value;
      void navigate({ to: "/chats/$id", params: { id: chat.id } }).finally(() => {
        resetComposerSession();
      });
    }
  }, [sendResult, navigate, resetComposerSession]);

  const hasStarted = state.sentText.length > 0 || state.streamedText.length > 0;

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el === null) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerText(event.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (!state.canSend) {
      return;
    }
    void send();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && isDesktop()) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center border-b border-border px-4 py-3">
        <span className="font-semibold text-foreground">Agent</span>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-8 text-center text-3xl font-semibold text-foreground">
              Ask your Agent anything...
            </h1>

            <ComposerInput
              ref={textareaRef}
              text={state.text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              canSend={state.canSend}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-4 py-6">
            <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                  {state.sentText}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-foreground">
                  {state.sendError !== null ? (
                    <span className="text-destructive" role="alert">
                      {state.sendError}
                    </span>
                  ) : state.streamedText.length === 0 ? (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce [animation-delay:0.2s]">.</span>
                      <span className="animate-bounce [animation-delay:0.4s]">.</span>
                    </span>
                  ) : (
                    state.streamedText
                  )}
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-2xl pt-4">
              <ComposerInput
                ref={textareaRef}
                text={state.text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSend={handleSend}
                canSend={state.canSend}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

