import { ChatSseEvent as ChatSseEventSchema } from "@template/core/domain/chat-sse.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Effect, Layer, Schema, Stream } from "effect";
import * as Sse from "effect/unstable/encoding/Sse";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { ChatNetworkError, ChatSseError } from "@/chat/chat.errors";
import type { IChatService } from "@/chat/service/chat.service";
import { ChatService } from "@/chat/service/chat.service";

const decodeChatSse = (response: HttpClientResponse.HttpClientResponse) =>
  response.stream.pipe(
    Stream.decodeText,
    Stream.pipeThroughChannel(Sse.decodeSchema(ChatSseEventSchema)),
    Stream.mapError((error) => new ChatSseError({ cause: error })),
  );

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
        return decodeChatSse(response);
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
        return decodeChatSse(response);
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    const list: IChatService["list"] = () =>
      Effect.gen(function* () {
        const response = yield* client.get("/api/chats");
        yield* HttpClientResponse.filterStatusOk(response);
        const json = yield* response.json;
        return Schema.decodeUnknownSync(Schema.Array(ChatModel.ChatMetadata))(json);
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    const remove: IChatService["remove"] = (id) =>
      Effect.gen(function* () {
        const response = yield* client.del(`/api/chats/${id}`);
        yield* HttpClientResponse.filterStatusOk(response);
      }).pipe(Effect.mapError((error) => new ChatNetworkError({ cause: error })));

    return { startChat, getChat, continueChat, list, remove };
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
