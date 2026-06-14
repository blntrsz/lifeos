import { Clock, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlModel } from "effect/unstable/sql";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";

import * as ChatModel from "@/domain/chat.model";

import { ChatService, type IChatService } from "./service/chat.service";

export const SqlChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const repository = yield* SqlModel.makeRepository(ChatModel.ChatModel, {
      idColumn: "id",
      tableName: "chat",
      spanPrefix: "SqlChatService",
    });

    const listAll = SqlSchema.findAll({
      Request: Schema.Struct({}),
      Result: ChatModel.ChatMetadata,
      execute: () => sql`SELECT id, title, createdAt, updatedAt FROM chat ORDER BY updatedAt DESC`,
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

    const continueChat: IChatService["continueChat"] = Effect.fn("SqlChatService.continueChat")(
      function* (id, input) {
        const existing = yield* repository
          .findById(id)
          .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

        const agentText = ChatModel.createPlaceholderAgentText(input.message.text);
        const history = ChatModel.appendCompletedHistory(
          existing.history,
          input.message.text,
          agentText,
        );
        const updatedAt = yield* Clock.currentTimeMillis.pipe(
          Effect.map((millis) => new Date(millis)),
        );

        const updatedChat = yield* repository
          .update(
            ChatModel.ChatModel.update.make({
              id,
              title: existing.title,
              createdAt: existing.createdAt,
              updatedAt,
              history,
            }),
          )
          .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

        return {
          chat: updatedChat,
          agentText,
        };
      },
    );

    const list: IChatService["list"] = Effect.fn("SqlChatService.list")(function* () {
      return yield* listAll({}).pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    const get: IChatService["get"] = Effect.fn("SqlChatService.get")(function* (id) {
      return yield* repository
        .findById(id)
        .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    return {
      startChat,
      continueChat,
      list,
      get,
    };
  }),
);
