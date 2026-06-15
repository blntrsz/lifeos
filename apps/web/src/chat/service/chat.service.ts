import type { ChatSseEvent } from "@template/core/domain/chat-sse.model";
import type {
  ChatMetadata,
  ChatModel as ChatModelType,
  ContinueChatInput,
  StartChatInput,
} from "@template/core/domain/chat.model";
import { Context, type Effect } from "effect";
import type { Stream } from "effect/Stream";

import type { ChatNetworkError, ChatSseError } from "@/chat/chat.errors";

export interface IChatService {
  startChat(
    input: StartChatInput,
  ): Effect.Effect<Stream<ChatSseEvent, ChatNetworkError | ChatSseError>, ChatNetworkError>;
  getChat(id: string): Effect.Effect<typeof ChatModelType.Type, ChatNetworkError>;
  continueChat(
    id: string,
    input: ContinueChatInput,
  ): Effect.Effect<Stream<ChatSseEvent, ChatNetworkError | ChatSseError>, ChatNetworkError>;
  list(): Effect.Effect<ReadonlyArray<ChatMetadata>, ChatNetworkError>;
  remove(id: string): Effect.Effect<void, ChatNetworkError>;
}

export class ChatService extends Context.Service<ChatService, IChatService>()("ChatService") {}
