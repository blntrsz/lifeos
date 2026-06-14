import { Cause, Context, type Effect } from "effect";
import type { SchemaError } from "effect/Schema";

import type * as ChatModel from "@/domain/chat.model";
import type { IdService } from "@/domain/id/service/id.service";

export type StartChatResult = {
  readonly chat: ChatModel.Type;
  readonly agentText: string;
};

export interface IChatService {
  startChat(
    input: ChatModel.StartChatInput,
  ): Effect.Effect<StartChatResult, SchemaError, IdService>;
  get(
    id: typeof ChatModel.ChatId.Type,
  ): Effect.Effect<ChatModel.Type, Cause.NoSuchElementError | SchemaError>;
}

export class ChatService extends Context.Service<ChatService, IChatService>()("ChatService") {}
