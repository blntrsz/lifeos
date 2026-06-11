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
