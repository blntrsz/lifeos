import { Cause, Clock, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import * as ChatModel from "@/domain/chat.model";

import { ChatService, type IChatService } from "./service/chat.service";

type ChatRow = {
  readonly id: string;
  readonly title: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly history: string;
};

const decodeChatRecord = Schema.decodeUnknownEffect(ChatModel.ChatRecord);

const toChatRecord = (row: ChatRow) =>
  decodeChatRecord({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: row.history,
  });

const nowIso = Clock.currentTimeMillis.pipe(Effect.map((millis) => new Date(millis).toISOString()));

export const SqlChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const firstSend: IChatService["firstSend"] = Effect.fn("SqlChatService.firstSend")(
      function* (input) {
        const chatId = yield* ChatModel.createChatId();
        const timestamp = yield* nowIso;
        const title = ChatModel.deriveTitle(input.message.text);
        const agentText = `Agent received: ${input.message.text}`;
        const history = yield* ChatModel.createCompletedHistoryJson(input.message.text, agentText);

        yield* sql`INSERT INTO chat ${sql.insert({
          id: chatId,
          title,
          created_at: timestamp,
          updated_at: timestamp,
          history,
        })}`.pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

        return {
          chat: {
            id: chatId,
            title,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          agentText,
        };
      },
    );

    const get: IChatService["get"] = Effect.fn("SqlChatService.get")(function* (id) {
      const rows = yield* sql`SELECT * FROM chat WHERE id = ${id}`.pipe(
        Effect.catchTag("SqlError", (error) => Effect.die(error)),
      );
      const row = (rows as ReadonlyArray<ChatRow>)[0];

      if (row === undefined) {
        return yield* Effect.fail(new Cause.NoSuchElementError());
      }

      return yield* toChatRecord(row);
    });

    return {
      firstSend,
      get,
    };
  }),
);
