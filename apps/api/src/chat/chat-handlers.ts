import { ChatService } from "@template/core/chat/service/chat.service";
import { ChatId } from "@template/core/domain/chat.model";
import { Effect, Layer, Stream } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";

import { ChatApi, ChatJsonResponse } from "./chat-api.ts";

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const ChatHandlers = Layer.mergeAll(
  HttpRouter.add("POST", ChatApi.firstSendPath, () =>
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(ChatApi.firstSendPayload);
      const chats = yield* ChatService;
      const result = yield* chats.firstSend(input).pipe(Effect.orDie);
      const stream = Stream.make(
        sse("chat", result.chat),
        sse("delta", { text: result.agentText }),
        sse("done", { reason: "complete" }),
      ).pipe(Stream.encodeText);

      return HttpServerResponse.stream(stream, {
        contentType: "text/event-stream",
        headers: {
          "cache-control": "no-cache",
        },
      });
    }),
  ),
  HttpRouter.add("GET", ChatApi.getPath, (request) =>
    Effect.gen(function* () {
      const id = ChatId.make(request.url.slice(request.url.lastIndexOf("/") + 1));
      const chats = yield* ChatService;
      const chat = yield* chats
        .get(id)
        .pipe(Effect.catchTag("NoSuchElementError", () => Effect.succeed(null)));

      if (chat === null) {
        return HttpServerResponse.empty({ status: 404 });
      }

      return yield* ChatJsonResponse(chat);
    }),
  ),
);
