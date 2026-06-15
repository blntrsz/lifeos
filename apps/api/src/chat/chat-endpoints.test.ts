import { afterAll, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ChatId } from "@template/core/domain/chat.model";

import { makeWebHandler } from "../layers.ts";

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

  test("start chat creates a Chat, streams the Agent response, and persists completed Prompt history", async () => {
    const startChatResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
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

  test("continue chat appends user and Agent turns to persisted Prompt history and streams SSE", async () => {
    const startChatResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Help me plan today" } }),
      }),
    );

    expect(startChatResponse.status).toBe(200);

    const startEvents = parseSseEvents(await startChatResponse.text());
    const chat = startEvents[0]?.data as { readonly id: string };

    const continueResponse = await handler(
      new Request(`http://localhost/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "What should I do next?" } }),
      }),
    );

    expect(continueResponse.status).toBe(200);
    expect(continueResponse.headers.get("content-type")).toContain("text/event-stream");

    const events = parseSseEvents(await continueResponse.text());

    expect(events).toEqual([
      {
        event: "chat",
        data: {
          id: chat.id,
          title: "Help me plan today",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
      { event: "delta", data: { text: "Agent received: What should I do next?" } },
      { event: "done", data: { reason: "complete" } },
    ]);

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
          { role: "user", content: "What should I do next?", options: {} },
          { role: "assistant", content: "Agent received: What should I do next?", options: {} },
        ],
      },
    });
  });

  test("continuing a missing chat returns not found", async () => {
    const response = await handler(
      new Request("http://localhost/api/chats/cht-missing/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Hello?" } }),
      }),
    );

    expect(response.status).toBe(404);
  });
});

describe("chat list endpoints", () => {
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

  test("list returns empty array when no chats exist", async () => {
    const response = await handler(new Request("http://localhost/api/chats"));

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual([]);
  });

  test("list returns chats with metadata shape and without history", async () => {
    const startResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Hello world" } }),
      }),
    );

    const startEvents = parseSseEvents(await startResponse.text());
    const chat = startEvents[0]?.data as { readonly id: string };

    const listResponse = await handler(new Request("http://localhost/api/chats"));

    expect(listResponse.status).toBe(200);
    const body = (await listResponse.json()) as ReadonlyArray<Record<string, unknown>>;

    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({
      id: chat.id,
      title: "Hello world",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(body[0]).not.toHaveProperty("history");
  });

  test("list derives title from first user message", async () => {
    await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "  Plan my weekly schedule  " } }),
      }),
    );

    const listResponse = await handler(new Request("http://localhost/api/chats"));

    expect(listResponse.status).toBe(200);
    const body = (await listResponse.json()) as ReadonlyArray<Record<string, unknown>>;

    expect(body[0]!.title).toBe("Plan my weekly schedule");
  });

  test("list orders chats by most recent activity first", async () => {
    const firstResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "First chat" } }),
      }),
    );

    const firstEvents = parseSseEvents(await firstResponse.text());
    const firstChat = firstEvents[0]?.data as { readonly id: string };

    const secondResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Second chat" } }),
      }),
    );

    const secondEvents = parseSseEvents(await secondResponse.text());
    const secondChat = secondEvents[0]?.data as { readonly id: string };

    const listResponse = await handler(new Request("http://localhost/api/chats"));

    expect(listResponse.status).toBe(200);
    const body = (await listResponse.json()) as ReadonlyArray<Record<string, unknown>>;

    const firstIndex = body.findIndex((c) => c.id === firstChat.id);
    const secondIndex = body.findIndex((c) => c.id === secondChat.id);

    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});

describe("chat delete endpoints", () => {
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

  test("deleting a chat removes its metadata and persisted history", async () => {
    const startResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Delete me" } }),
      }),
    );

    const startEvents = parseSseEvents(await startResponse.text());
    const chat = startEvents[0]?.data as { readonly id: string };

    const deleteResponse = await handler(
      new Request(`http://localhost/api/chats/${chat.id}`, { method: "DELETE" }),
    );

    expect(deleteResponse.status).toBe(204);

    const getResponse = await handler(new Request(`http://localhost/api/chats/${chat.id}`));

    expect(getResponse.status).toBe(404);
  });

  test("deleting a non-existent chat returns not found", async () => {
    const response = await handler(
      new Request("http://localhost/api/chats/cht-no-such-chat", { method: "DELETE" }),
    );

    expect(response.status).toBe(404);
  });

  test("deleted chat is excluded from listing", async () => {
    const keepResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Keep me" } }),
      }),
    );

    const keepEvents = parseSseEvents(await keepResponse.text());
    const keepChat = keepEvents[0]?.data as { readonly id: string };

    const deleteResponse = await handler(
      new Request("http://localhost/api/chats/start-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Delete me too" } }),
      }),
    );

    const deleteEvents = parseSseEvents(await deleteResponse.text());
    const deleteChat = deleteEvents[0]?.data as { readonly id: string };

    await handler(new Request(`http://localhost/api/chats/${deleteChat.id}`, { method: "DELETE" }));

    const listResponse = await handler(new Request("http://localhost/api/chats"));

    expect(listResponse.status).toBe(200);
    const body = (await listResponse.json()) as ReadonlyArray<Record<string, unknown>>;

    expect(body).toHaveLength(1);
    expect(body[0]!.id).toBe(keepChat.id);
  });
});
