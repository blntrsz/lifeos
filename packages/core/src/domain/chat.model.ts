import { Effect, Schema } from "effect";
import { Chat, Prompt } from "effect/unstable/ai";

import { IdService } from "@/domain/id/service/id.service";

export const ChatId = Schema.String.pipe(Schema.brand("ChatId"));

export const ChatMetadata = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type ChatMetadata = typeof ChatMetadata.Type;

export const ChatRecord = Schema.Struct({
  ...ChatMetadata.fields,
  history: Schema.fromJsonString(Prompt.Prompt),
});

export type ChatRecord = typeof ChatRecord.Type;

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

export const createCompletedHistoryJson = Effect.fn("ChatModel.createCompletedHistoryJson")(
  function* (userText: string, agentText: string) {
    const chat = yield* Chat.fromPrompt([
      { role: "user", content: userText },
      { role: "assistant", content: agentText },
    ]);

    return yield* chat.exportJson.pipe(Effect.orDie);
  },
);
