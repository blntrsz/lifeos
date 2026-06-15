import { ChatService } from "@template/core/chat/service/chat.service";
import type { StartChatResult } from "@template/core/chat/service/chat.service";
import { ChatSseEvent } from "@template/core/domain/chat-sse.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Effect, Stream } from "effect";
import * as Sse from "effect/unstable/encoding/Sse";
import { HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { ChatApi } from "./chat-api.ts";

const chatSseResponse = (result: StartChatResult) => {
  const stream = Stream.make(
    { event: "chat" as const, id: undefined, data: ChatModel.toMetadata(result.chat) },
    { event: "delta" as const, id: undefined, data: { text: result.agentText } },
    { event: "done" as const, id: undefined, data: { reason: "complete" as const } },
  ).pipe(Stream.pipeThroughChannel(Sse.encodeSchema(ChatSseEvent)), Stream.encodeText);

  return HttpServerResponse.stream(stream, {
    contentType: "text/event-stream",
    headers: {
      "cache-control": "no-cache",
    },
  });
};

export const ChatHandlers = HttpApiBuilder.group(ChatApi, "Chats", (handlers) =>
  handlers
    .handle("list", () =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        return yield* chats.list().pipe(Effect.orDie);
      }),
    )
    .handle("startChat", ({ payload }) =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        const result = yield* chats.startChat(payload).pipe(Effect.orDie);

        return chatSseResponse(result);
      }),
    )
    .handle("continueChat", ({ params, payload }) =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        const result = yield* chats.continueChat(params.id, payload).pipe(
          Effect.catchTag("NoSuchElementError", () => Effect.fail(new HttpApiError.NotFound({}))),
          Effect.catchTag("SchemaError", () => Effect.fail(new HttpApiError.BadRequest())),
        );

        return chatSseResponse(result);
      }),
    )
    .handle("get", ({ params }) =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        const chat = yield* chats.get(params.id).pipe(
          Effect.catchTag("NoSuchElementError", () => Effect.fail(new HttpApiError.NotFound({}))),
          Effect.catchTag("SchemaError", () => Effect.fail(new HttpApiError.BadRequest())),
        );

        return chat;
      }),
    )
    .handle("remove", ({ params }) =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        return yield* chats.remove(params.id).pipe(
          Effect.catchTag("NoSuchElementError", () => Effect.fail(new HttpApiError.NotFound({}))),
          Effect.orDie,
        );
      }),
    ),
);
