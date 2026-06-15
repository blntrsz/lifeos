import type { ChatSseEvent } from "@template/core/domain/chat-sse.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Effect, Layer, Schema, Stream } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { ChatNetworkError } from "@/chat/chat.errors";
import type { IChatService } from "@/chat/service/chat.service";
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

export const HttpChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    const startChat: IChatService["startChat"] = (input) =>
      Effect.gen(function* () {
        const request = HttpClientRequest.post("/api/chats/start-chat").pipe(
          HttpClientRequest.bodyJsonUnsafe(input),
        );
        const response = yield* client.execute(request);
        yield* HttpClientResponse.filterStatusOk(response);
        const text = yield* response.text;
        return Stream.fromIterable(parseSseFromText(text));
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    const getChat: IChatService["getChat"] = (id) =>
      Effect.gen(function* () {
        const response = yield* client.get(`/api/chats/${id}`);
        yield* HttpClientResponse.filterStatusOk(response);
        const json = yield* response.json;
        return Schema.decodeUnknownSync(ChatModel.ChatModel.json)(json);
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    const continueChat: IChatService["continueChat"] = (id, input) =>
      Effect.gen(function* () {
        const request = HttpClientRequest.post(`/api/chats/${id}/messages`).pipe(
          HttpClientRequest.bodyJsonUnsafe(input),
        );
        const response = yield* client.execute(request);
        yield* HttpClientResponse.filterStatusOk(response);
        const text = yield* response.text;
        return Stream.fromIterable(parseSseFromText(text));
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    const list: IChatService["list"] = () =>
      Effect.gen(function* () {
        const response = yield* client.get("/api/chats");
        yield* HttpClientResponse.filterStatusOk(response);
        const json = yield* response.json;
        return Schema.decodeUnknownSync(Schema.Array(ChatModel.ChatMetadata))(json);
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    return { startChat, getChat, continueChat, list };
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
