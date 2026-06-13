import { afterAll, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ChatId } from "@template/core/domain/chat.model";

import { makeWebHandler } from "../layers.ts";

const databaseFilename = join(tmpdir(), `lifeos-api-${crypto.randomUUID()}.db`);
const { handler, dispose } = makeWebHandler(databaseFilename);

afterAll(async () => {
  await dispose();
  await Promise.all([
    Bun.file(databaseFilename)
      .delete()
      .catch(() => undefined),
    Bun.file(`${databaseFilename}-shm`)
      .delete()
      .catch(() => undefined),
    Bun.file(`${databaseFilename}-wal`)
      .delete()
      .catch(() => undefined),
  ]);
});

const parseSseEvents = (streamText: string) =>
  streamText
    .trim()
    .split("\n\n")
    .map((eventText) => {
      const event = eventText.match(/^event: (.+)$/m)?.[1];
      const data = eventText.match(/^data: (.+)$/m)?.[1];

      return { event, data: data === undefined ? undefined : JSON.parse(data) };
    });

describe("chat endpoints", () => {
  test("start chat creates a Chat, streams the Agent response, and persists completed Prompt history", async () => {
    const startChatResponse = await handler(
      new Request("http://localhost/api/chats/first-send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Help me plan today" } }),
      }),
    );

    expect(startChatResponse.status).toBe(200);
    expect(startChatResponse.headers.get("content-type")).toContain("text/event-stream");

    const events = parseSseEvents(await startChatResponse.text());

    expect(events).toEqual([
      {
        event: "chat",
        data: {
          id: expect.stringMatching(/^cht-/),
          title: "Help me plan today",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
      { event: "delta", data: { text: "Agent received: Help me plan today" } },
      { event: "done", data: { reason: "complete" } },
    ]);

    const chat = events[0]?.data as { readonly id: string };
    const persistedResponse = await handler(new Request(`http://localhost/api/chats/${chat.id}`));

    expect(persistedResponse.status).toBe(200);
    expect(await persistedResponse.json()).toEqual({
      id: ChatId.make(chat.id),
      title: "Help me plan today",
      createdAt: events[0]?.data.createdAt,
      updatedAt: events[0]?.data.updatedAt,
      history: {
        content: [
          { role: "user", content: "Help me plan today", options: {} },
          { role: "assistant", content: "Agent received: Help me plan today", options: {} },
        ],
      },
    });
  });
});
