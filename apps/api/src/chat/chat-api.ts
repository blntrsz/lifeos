import { ChatId, FirstSendInput } from "@template/core/domain/chat.model";
import * as ChatModel from "@template/core/domain/chat.model";
import { HttpServerResponse } from "effect/unstable/http";

export const ChatApi = {
  firstSendPath: "/api/chats/first-send",
  getPath: "/api/chats/:id",
  firstSendPayload: FirstSendInput,
  getParams: { id: ChatId },
  chatJson: ChatModel.ChatModel.json,
} as const;

export const ChatJsonResponse = HttpServerResponse.schemaJson(ChatApi.chatJson);
