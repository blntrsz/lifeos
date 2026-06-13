import type { ChatMetadata } from "@template/core/domain/chat.model";
import { Effect, Stream } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Atom from "effect/unstable/reactivity/Atom";

import { ChatMessageRequiredError, ChatSseError } from "@/chat/chat.errors";
import { HttpChatService } from "@/chat/layer/http-chat.service";
import { ChatService } from "@/chat/service/chat.service";

export const chatRuntime = Atom.runtime(HttpChatService);

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
