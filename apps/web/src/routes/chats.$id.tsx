import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { useEffect, useRef } from "react";

import { ComposerInput } from "@/chat/chat-composer";
import * as ChatAtoms from "@/chat/chat.atoms";

export const Route = createFileRoute("/chats/$id")({ component: ChatPage });

function ChatPage() {
  const rawParams = useParams({ strict: false });
  const id = rawParams.id;

  const load = useAtomSet(ChatAtoms.loadChat, { mode: "promise" });
  const loadResult = useAtomValue(ChatAtoms.loadChat);
  const messages = useAtomValue(ChatAtoms.chatMessages);

  const continueState = useAtomValue(ChatAtoms.continueState);
  const [, setContinueText] = useAtom(ChatAtoms.continueComposerText);
  const sendContinue = useAtomSet(ChatAtoms.sendContinueMessage, { mode: "promise" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (id !== undefined && id !== "undefined") {
      void load(id).catch(() => undefined);
    }
  }, [id, load]);

  const isLoading = AsyncResult.isInitial(loadResult) || loadResult.waiting;
  const isError = AsyncResult.isFailure(loadResult);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el === null) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContinueText(event.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (!continueState.canSend || id === undefined) {
      return;
    }
    void sendContinue({ chatId: id, text: continueState.text }).catch(() => undefined);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && typeof window !== "undefined") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-destructive" role="alert">
            Chat not found
          </span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 py-6">
          <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {continueState.sending && continueState.streamedText.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                    <span className="animate-bounce [animation-delay:0.4s]">.</span>
                  </span>
                </div>
              </div>
            )}
            {continueState.streamedText.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-foreground">
                  {continueState.streamedText}
                </div>
              </div>
            )}
            {continueState.sendError !== null && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-foreground">
                  <span className="text-destructive" role="alert">
                    {continueState.sendError}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-2xl pt-4">
            <ComposerInput
              ref={textareaRef}
              text={continueState.text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              canSend={continueState.canSend}
            />
          </div>
        </div>
      )}
    </div>
  );
}
