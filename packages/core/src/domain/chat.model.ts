import { Effect, Ref, Schema } from "effect";
import { Chat, Prompt } from "effect/unstable/ai";
import { Model } from "effect/unstable/schema";

import { IdService } from "@/domain/id/service/id.service";

export const ChatId = Schema.String.pipe(Schema.brand("ChatId"));

export class ChatModel extends Model.Class<ChatModel>("Chat")({
  id: Model.GeneratedByApp(ChatId),
  title: Schema.String,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
  history: Schema.fromJsonString(Prompt.Prompt),
}) {}

export type ChatRecord = typeof ChatModel.Type;

export type ChatMetadata = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const encodeChatModelJson = Schema.encodeSync(ChatModel.json);
const encodePromptJson = Schema.encodeSync(Prompt.Prompt);

export const encodeChatRecord = (chat: ChatRecord) => ({
  ...encodeChatModelJson(chat),
  history: encodePromptJson(chat.history),
});

export const encodeChatMetadata = (chat: ChatRecord): ChatMetadata => {
  const encoded = encodeChatModelJson(chat);

  return {
    id: encoded.id,
    title: encoded.title,
    createdAt: encoded.createdAt,
    updatedAt: encoded.updatedAt,
  };
};

export const FirstSendInput = Schema.Struct({
  message: Schema.Struct({
    text: Schema.String,
  }),
});

export type FirstSendInput = typeof FirstSendInput.Type;

export const createChatId = Effect.fn("ChatModel.createChatId")(function* () {
  const idService = yield* IdService;
  const id = yield* idService.create();

  return ChatId.make(`cht-${id}`);
});

export const deriveTitle = (messageText: string) => {
  const title = messageText.trim().replace(/\s+/g, " ").slice(0, 60);

  return title.length === 0 ? "Untitled Chat" : title;
};

export const createCompletedHistory = Effect.fn("ChatModel.createCompletedHistory")(function* (
  userText: string,
  agentText: string,
) {
  const chat = yield* Chat.fromPrompt([
    { role: "user", content: userText },
    { role: "assistant", content: agentText },
  ]);

  return yield* Ref.get(chat.history);
});
