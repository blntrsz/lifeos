import { ChatService } from "@template/core/chat/service/chat.service";
import * as ChatModel from "@template/core/domain/chat.model";
import { Effect, Stream } from "effect";
import * as Sse from "effect/unstable/encoding/Sse";
import { HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { ChatApi, ChatSseEvent } from "./chat-api.ts";

export const ChatHandlers = HttpApiBuilder.group(ChatApi, "Chats", (handlers) =>
  handlers
    .handle("startChat", ({ payload }) =>
      Effect.gen(function* () {
        const chats = yield* ChatService;
        const result = yield* chats.startChat(payload).pipe(Effect.orDie);
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
    ),
);
