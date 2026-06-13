import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDirectory = await mkdtemp(join(tmpdir(), "lifeos-api-"));
const databaseFilename = join(tempDirectory, "lifeos.db");
process.env.LIFEOS_DATABASE_FILENAME = databaseFilename;

const { handleRequest } = await import("./layers.ts");

afterAll(async () => {
  await rm(tempDirectory, { recursive: true, force: true });
});

describe("LifeOS database boundary", () => {
  test("start chat creates a Chat, streams the Agent response, and persists completed Prompt history", async () => {
    const startChatResponse = await handleRequest(
      new Request("http://localhost/api/chats/first-send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: { text: "Help me plan today" } }),
      }),
    );

    expect(startChatResponse.status).toBe(200);
    expect(startChatResponse.headers.get("content-type")).toContain("text/event-stream");

    const streamText = await startChatResponse.text();
    const events = streamText
      .trim()
      .split("\n\n")
      .map((eventText) => {
        const event = eventText.match(/^event: (.+)$/m)?.[1];
        const data = eventText.match(/^data: (.+)$/m)?.[1];

        return { event, data: data === undefined ? undefined : JSON.parse(data) };
      });

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
    const persistedResponse = await handleRequest(
      new Request(`http://localhost/api/chats/${chat.id}`),
    );

    expect(persistedResponse.status).toBe(200);
    expect(await persistedResponse.json()).toEqual({
      id: chat.id,
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

  test("keeps dormant task persistence compatible", async () => {
    const createResponse = await handleRequest(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Reference task" }),
      }),
    );

    expect(createResponse.status).toBe(200);

    const created = (await createResponse.json()) as { readonly id: string; readonly name: string };
    expect(created.name).toBe("Reference task");

    const listResponse = await handleRequest(new Request("http://localhost/api/tasks"));

    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([created]);
  });
});
