import { Effect, Layer } from "effect";
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

    const startChat: IChatService["startChat"] = Effect.fn("SqlChatService.startChat")(
      function* (input) {
        const agentText = ChatModel.createPlaceholderAgentText(input.message.text);
        const chat = yield* ChatModel.make(input, agentText);

        const persistedChat = yield* repository
          .insert(chat)
          .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

        return {
          chat: persistedChat,
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
      startChat,
      get,
    };
  }),
);
