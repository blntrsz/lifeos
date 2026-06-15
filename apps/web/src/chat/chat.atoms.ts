import type { ChatMetadata } from "@template/core/domain/chat.model";
import { Effect, Stream } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Atom from "effect/unstable/reactivity/Atom";

import { ChatMessageRequiredError, ChatSseError } from "@/chat/chat.errors";
import { HttpChatService } from "@/chat/layer/http-chat.service";
import { ChatService } from "@/chat/service/chat.service";

export const chatRuntime = Atom.runtime(HttpChatService);

export const chatList = chatRuntime
  .atom(ChatService.use((service) => service.list()))
  .pipe(Atom.keepAlive);

export const composerText = Atom.make("");
export const sentText = Atom.make("");
export const streamedText = Atom.make("");

export const sendFirstMessage = chatRuntime.fn<void>()((_, get) =>
  Effect.gen(function* () {
    const text = get(composerText).trim();

    if (text.length === 0) {
      return yield* Effect.fail(new ChatMessageRequiredError());
    }

    get.set(sentText, text);
    get.set(composerText, "");

    const service = yield* ChatService;
    const events = yield* service.startChat({ message: { text } });

    let chat: ChatMetadata | null = null;

    yield* Stream.runForEach(events, (event) =>
      Effect.sync(() => {
        if (event.event === "chat") {
          chat = event.data;
        } else if (event.event === "delta") {
          const current = get(streamedText);
          get.set(streamedText, `${current}${event.data.text}`);
        }
      }),
    );

    if (chat === null) {
      return yield* Effect.fail(new ChatSseError({ cause: "No chat event received" }));
    }

    return chat;
  }),
);

export const resetComposerSession = Atom.fn<void>()((_, get) =>
  Effect.sync(() => {
    get.set(composerText, "");
    get.set(sentText, "");
    get.set(streamedText, "");
    get.set(sendFirstMessage, Atom.Reset);
  }),
);

export const composerState = Atom.make((get) => {
  const text = get(composerText);
  const sendState = get(sendFirstMessage);
  const sending = !AsyncResult.isInitial(sendState) && sendState.waiting;

  return {
    text,
    canSend: text.trim().length > 0 && !sending,
    sending,
    sendError: AsyncResult.isFailure(sendState) ? String(sendState.cause) : null,
    sentText: get(sentText),
    streamedText: get(streamedText),
  };
});

export type ChatMessage =
  | { readonly role: "user"; readonly content: string }
  | { readonly role: "assistant"; readonly content: string; readonly streaming?: boolean };

export const chatMessages = Atom.make<ReadonlyArray<ChatMessage>>([]);

export const loadChat = chatRuntime.fn<string>()((id, get) =>
  Effect.gen(function* () {
    const service = yield* ChatService;
    const chat = yield* service.getChat(id);

    const messages: Array<ChatMessage> = [];

    if (chat.history?.content !== undefined) {
      for (const item of chat.history.content) {
        if (item.role === "user" || item.role === "assistant") {
          const content = extractTextContent(item.content);
          messages.push({ role: item.role, content });
        }
      }
    }

    get.set(chatMessages, messages);
    return chat;
  }),
);

export const continueComposerText = Atom.make("");

export const continueStreamedText = Atom.make("");

export type ContinueInput = { readonly chatId: string; readonly text: string };

export const sendContinueMessage = chatRuntime.fn<ContinueInput>()((input, get) =>
  Effect.gen(function* () {
    const trimmed = input.text.trim();
    if (trimmed.length === 0) {
      return yield* Effect.fail(new ChatMessageRequiredError());
    }

    const currentMessages = get(chatMessages);
    get.set(chatMessages, [...currentMessages, { role: "user", content: trimmed }]);
    get.set(continueComposerText, "");
    get.set(continueStreamedText, "");

    const service = yield* ChatService;

    const events = yield* service.continueChat(input.chatId, { message: { text: trimmed } });

    yield* Stream.runForEach(events, (event) =>
      Effect.sync(() => {
        if (event.event === "delta") {
          const current = get(continueStreamedText);
          get.set(continueStreamedText, `${current}${event.data.text}`);
        } else if (event.event === "done") {
          const streamed = get(continueStreamedText);
          const msgs = get(chatMessages);
          get.set(chatMessages, [...msgs, { role: "assistant", content: streamed }]);
          get.set(continueStreamedText, "");
        }
      }),
    );

    return true;
  }),
);

export const resetContinueComposer = Atom.fn<void>()((_, get) =>
  Effect.sync(() => {
    get.set(continueComposerText, "");
    get.set(continueStreamedText, "");
    get.set(sendContinueMessage, Atom.Reset);
  }),
);

export const continueState = Atom.make((get) => {
  const text = get(continueComposerText);
  const sendState = get(sendContinueMessage);
  const sending = !AsyncResult.isInitial(sendState) && sendState.waiting;
  const streamed = get(continueStreamedText);

  return {
    text,
    canSend: text.trim().length > 0 && !sending,
    sending,
    sendError: AsyncResult.isFailure(sendState) ? String(sendState.cause) : null,
    streamedText: streamed,
    isStreaming: streamed.length > 0 || sending,
  };
});

const extractTextContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { readonly type: "text"; readonly text: string } =>
          typeof part === "object" &&
          part !== null &&
          (part as Record<string, unknown>).type === "text",
      )
      .map((part) => part.text)
      .join("");
  }
  return "";
};
