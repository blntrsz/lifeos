import { ChatId, ContinueChatInput, StartChatInput } from "@template/core/domain/chat.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { HttpApiSchema } from "effect/unstable/httpapi";

const ChatIdParams = { id: ChatId };

export const ChatApi = HttpApi.make("ChatApi")
  .annotate(OpenApi.Title, "Chat API")
  .add(
    HttpApiGroup.make("Chats").add(
      HttpApiEndpoint.post("startChat", "/chats/start-chat", {
        payload: StartChatInput,
        success: Schema.String.pipe(HttpApiSchema.asText()),
      }),
      HttpApiEndpoint.post("continueChat", "/chats/:id/messages", {
        params: ChatIdParams,
        payload: ContinueChatInput,
        success: Schema.String.pipe(HttpApiSchema.asText()),
        error: [HttpApiError.NotFound, HttpApiError.BadRequest],
      }),
      HttpApiEndpoint.get("get", "/chats/:id", {
        params: ChatIdParams,
        success: ChatModel.ChatModel.json,
        error: [HttpApiError.NotFound, HttpApiError.BadRequest],
      }),
    ),
  )
  .prefix("/api");
