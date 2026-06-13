import { DateTime, Effect, Layer } from "effect";
import { Model } from "effect/unstable/schema";
import { SqlModel } from "effect/unstable/sql";

import * as ChatModel from "@/domain/chat.model";

import { ChatService, type IChatService } from "./service/chat.service";

export const SqlChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const repository = yield* SqlModel.makeRepository(ChatModel.ChatModel, {
      idColumn: "id",
      tableName: "chat",
      spanPrefix: "SqlChatService",
    });

    const firstSend: IChatService["firstSend"] = Effect.fn("SqlChatService.firstSend")(
      function* (input) {
        const chatId = yield* ChatModel.createChatId();
        const title = ChatModel.deriveTitle(input.message.text);
        const agentText = `Agent received: ${input.message.text}`;
        const history = yield* ChatModel.createCompletedHistory(input.message.text, agentText);
        const timestamp = yield* DateTime.now;

        const chat = ChatModel.ChatModel.insert.make({
          id: chatId,
          title,
          createdAt: Model.Override(timestamp),
          updatedAt: Model.Override(timestamp),
          history,
        });

        const persistedChat = yield* repository
          .insert(chat)
          .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

        return {
          chat: ChatModel.encodeChatMetadata(persistedChat),
          agentText,
        };
      },
    );

    const get: IChatService["get"] = Effect.fn("SqlChatService.get")(function* (id) {
      return yield* repository
        .findById(id)
        .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    return {
      firstSend,
      get,
    };
  }),
);
