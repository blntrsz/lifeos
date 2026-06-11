import { Cause, Context, type Effect } from "effect";
import type { SchemaError } from "effect/Schema";

import type { ChatId, ChatMetadata, ChatRecord, FirstSendInput } from "@/domain/chat.model";
import type { IdService } from "@/domain/id/service/id.service";

export type FirstSendResult = {
  readonly chat: ChatMetadata;
  readonly agentText: string;
};

export interface IChatService {
  firstSend(input: FirstSendInput): Effect.Effect<FirstSendResult, SchemaError, IdService>;
  get(id: typeof ChatId.Type): Effect.Effect<ChatRecord, Cause.NoSuchElementError | SchemaError>;
}

export class ChatService extends Context.Service<ChatService, IChatService>()("ChatService") {}
