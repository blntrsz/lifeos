import { ChatSseEvent } from "@template/core/domain/chat-sse.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Effect, Layer, Schema, Stream } from "effect";

import { ChatNetworkError } from "@/chat/chat.errors";
import { ChatService } from "@/chat/service/chat.service";

const parseSseFromText = (text: string): ReadonlyArray<ChatSseEvent> => {
  const events: Array<ChatSseEvent> = [];

  const blocks = text.trim().split("\n\n");
  for (const block of blocks) {
    const eventMatch = block.match(/^event: (.+)$/m);
    const dataMatch = block.match(/^data: (.+)$/m);
    const event = eventMatch?.[1] ?? "";
    const data = dataMatch?.[1] ?? "";

    try {
      const parsed = Schema.decodeUnknownSync(ChatSseEvent)({
        id: undefined,
        event,
        data,
      });
      events.push(parsed);
    } catch {
      // Skip unparseable events
    }
  }

  return events;
};

export const HttpChatService = Layer.succeed(
  ChatService,
  ChatService.of({
    startChat: (input) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch("/api/chats/start-chat", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(input),
            }),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        if (!response.ok) {
          return yield* Effect.fail(new ChatNetworkError({ cause: `HTTP ${response.status}` }));
        }

        const text = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        return Stream.fromIterable(parseSseFromText(text));
      }),

    getChat: (id) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () => fetch(`/api/chats/${id}`),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        if (!response.ok) {
          return yield* Effect.fail(new ChatNetworkError({ cause: `HTTP ${response.status}` }));
        }

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        return Schema.decodeUnknownSync(ChatModel.ChatModel.json)(json);
      }),

    continueChat: (id, input) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`/api/chats/${id}/messages`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(input),
            }),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        if (!response.ok) {
          return yield* Effect.fail(new ChatNetworkError({ cause: `HTTP ${response.status}` }));
        }

        const text = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) => new ChatNetworkError({ cause: error }),
        });

        return Stream.fromIterable(parseSseFromText(text));
      }),
  }),
);
