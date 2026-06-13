import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Effect } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { HttpApiClient } from "effect/unstable/httpapi";

import { makeWebHandler } from "../layers.ts";
import { TaskApi } from "./task-api.ts";

const databaseFilename = join(tmpdir(), `lifeos-api-${crypto.randomUUID()}.db`);
const { handler, dispose } = makeWebHandler(databaseFilename);

const makeBody = (request: HttpClientRequest.HttpClientRequest): RequestInit["body"] => {
  switch (request.body._tag) {
    case "Raw":
    case "Uint8Array":
      return request.body.body as RequestInit["body"];
    default:
      return undefined;
  }
};

const makeTaskClient = async () => {
  const httpClient = HttpClient.make((request, url, signal) =>
    Effect.promise(async () =>
      HttpClientResponse.fromWeb(
        request,
        await handler(
          new Request(url.toString(), {
            body: makeBody(request),
            headers: request.headers,
            method: request.method,
            signal,
          }),
        ),
      ),
    ),
  );

  return Effect.runPromise(
    HttpApiClient.makeWith(TaskApi, { baseUrl: "http://localhost", httpClient }),
  );
};

let taskClient: Awaited<ReturnType<typeof makeTaskClient>>;

beforeAll(async () => {
  taskClient = await makeTaskClient();
});

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

describe("task endpoints", () => {
  test("keeps dormant task persistence compatible", async () => {
    const created = await Effect.runPromise(
      taskClient.Tasks.create({ payload: { name: "Reference task" } }),
    );

    expect(created.name).toBe("Reference task");

    await expect(Effect.runPromise(taskClient.Tasks.list())).resolves.toEqual([created]);
  });
});
