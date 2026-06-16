import { Clock, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlModel } from "effect/unstable/sql";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";

import { AgentService } from "@/agent/service/agent.service";
import * as ChatModel from "@/domain/chat.model";

import { ChatService, type IChatService } from "./service/chat.service";

export const SqlChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const agent = yield* AgentService;
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
        const prompt = yield* ChatModel.createUserPrompt(input.message.text);
        const agentText = yield* agent.complete(prompt);
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

        const prompt = ChatModel.appendUserMessage(existing.history, input.message.text);
        const agentText = yield* agent.complete(prompt);
        const history = ChatModel.appendAgentMessage(prompt, agentText);
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

    const remove: IChatService["remove"] = Effect.fn("SqlChatService.remove")(function* (id) {
      yield* repository
        .findById(id)
        .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
      yield* repository.delete(id).pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    return {
      startChat,
      continueChat,
      list,
      get,
      remove,
    };
  }),
);
