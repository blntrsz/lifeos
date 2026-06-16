import { Clock, Effect, Ref, Schema } from "effect";
import { Chat, Prompt } from "effect/unstable/ai";
import { Model } from "effect/unstable/schema";

import { IdService } from "@/domain/id/service/id.service";

export const ChatId = Schema.String.pipe(Schema.brand("ChatId"));

export class ChatModel extends Model.Class<ChatModel>("Chat")({
  id: Model.GeneratedByApp(ChatId),
  title: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
  history: Model.Field({
    select: Schema.fromJsonString(Prompt.Prompt),
    insert: Schema.fromJsonString(Prompt.Prompt),
    update: Schema.fromJsonString(Prompt.Prompt),
    json: Prompt.Prompt,
  }),
}) {}

export type Type = typeof ChatModel.Type;

export const ChatMetadata = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type ChatMetadata = typeof ChatMetadata.Type;

const encodeChatModelJson = Schema.encodeSync(ChatModel.json);

export const toMetadata = (chat: Type): ChatMetadata => {
  const encoded = encodeChatModelJson(chat);

  return {
    id: ChatId.make(encoded.id),
    title: encoded.title,
    createdAt: encoded.createdAt,
    updatedAt: encoded.updatedAt,
  };
};

export const StartChatInput = Schema.Struct({
  message: Schema.Struct({
    text: Schema.String,
  }),
});

export type StartChatInput = typeof StartChatInput.Type;

export const ContinueChatInput = StartChatInput;
export type ContinueChatInput = typeof ContinueChatInput.Type;

export const createChatId = Effect.fn("ChatModel.createChatId")(function* () {
  const idService = yield* IdService;
  const id = yield* idService.create();

  return ChatId.make(`cht-${id}`);
});

export const deriveTitle = (messageText: string) => {
  const title = messageText.trim().replace(/\s+/g, " ").slice(0, 60);

  return title.length === 0 ? "Untitled Chat" : title;
};

export const createUserPrompt = Effect.fn("ChatModel.createUserPrompt")(function* (
  userText: string,
) {
  const chat = yield* Chat.fromPrompt([{ role: "user", content: userText }]);

  return yield* Ref.get(chat.history);
});

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

export const appendCompletedHistory = (
  existingHistory: Prompt.Prompt,
  userText: string,
  agentText: string,
) =>
  Prompt.concat(existingHistory, [
    { role: "user", content: userText },
    { role: "assistant", content: agentText },
  ]);

export const appendUserMessage = (existingHistory: Prompt.Prompt, userText: string) =>
  Prompt.concat(existingHistory, [{ role: "user", content: userText }]);

export const appendAgentMessage = (existingHistory: Prompt.Prompt, agentText: string) =>
  Prompt.concat(existingHistory, [{ role: "assistant", content: agentText }]);

export const make = Effect.fn("ChatModel.make")(function* (
  input: StartChatInput,
  agentText: string,
) {
  const id = yield* createChatId();
  const timestamp = yield* Clock.currentTimeMillis.pipe(Effect.map((millis) => new Date(millis)));
  const history = yield* createCompletedHistory(input.message.text, agentText);

  return ChatModel.insert.make({
    id,
    title: deriveTitle(input.message.text),
    createdAt: timestamp,
    updatedAt: timestamp,
    history,
  });
});
