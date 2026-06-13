import { ChatId, FirstSendInput } from "@template/core/domain/chat.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Schema } from "effect";
import * as Sse from "effect/unstable/encoding/Sse";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { HttpApiSchema } from "effect/unstable/httpapi";

const ChatIdParams = { id: ChatId };

export const ChatSseEvent = Schema.Union([
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("chat"),
    data: Schema.fromJsonString(ChatModel.ChatMetadata),
  }),
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("delta"),
    data: Schema.fromJsonString(Schema.Struct({ text: Schema.String })),
  }),
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("done"),
    data: Schema.fromJsonString(Schema.Struct({ reason: Schema.Literal("complete") })),
  }),
]);

export const ChatApi = HttpApi.make("ChatApi")
  .annotate(OpenApi.Title, "Chat API")
  .add(
    HttpApiGroup.make("Chats").add(
      HttpApiEndpoint.post("startChat", "/chats/first-send", {
        payload: FirstSendInput,
        success: Schema.String.pipe(HttpApiSchema.asText()),
      }),
      HttpApiEndpoint.get("get", "/chats/:id", {
        params: ChatIdParams,
        success: ChatModel.ChatModel.json,
        error: [HttpApiError.NotFound, HttpApiError.BadRequest],
      }),
    ),
  )
  .prefix("/api");
