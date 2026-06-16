import { NodeFileSystem, NodePath } from "@effect/platform-node-shared";
import { DeepSeekAgentService } from "@template/core/agent/deepseek-agent.service";
import type { AgentService } from "@template/core/agent/service/agent.service";
import { SqlChatService } from "@template/core/chat/sql-chat.service";
import { LifeOsDatabaseLive } from "@template/core/common/database";
import { UlidIdService } from "@template/core/domain/id/ulid-id.service";
import { SqlTaskService } from "@template/core/task/sql-task.service";
import { Context, Layer } from "effect";
import { Etag, HttpPlatform, HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { ChatApi } from "./chat/chat-api.ts";
import { ChatHandlers } from "./chat/chat-handlers.ts";
import { TaskApi } from "./task/task-api.ts";
import { TaskHandlers } from "./task/task-handlers.ts";

const lifeOsDbPath =
  process.env.LIFEOS_DATABASE_FILENAME ?? `${import.meta.dirname}/../data/lifeos.db`;

const DeepSeekAgentLive = DeepSeekAgentService({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseUrl: process.env.DEEPSEEK_BASE_URL,
  model: process.env.DEEPSEEK_MODEL,
});

const makeAppLive = (
  databaseFilename = lifeOsDbPath,
  AgentLive: Layer.Layer<AgentService> = DeepSeekAgentLive,
) => {
  const DatabaseLive = LifeOsDatabaseLive(databaseFilename);
  const ServicesLive = Layer.mergeAll(SqlTaskService, SqlChatService).pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(AgentLive),
    Layer.provide(UlidIdService),
  );

  const ApiLive = Layer.mergeAll(
    HttpApiBuilder.layer(TaskApi).pipe(Layer.provide(TaskHandlers)),
    HttpApiBuilder.layer(ChatApi).pipe(Layer.provide(ChatHandlers)),
  );

  return ApiLive.pipe(
    Layer.provide(HttpApiScalar.layer(TaskApi)),
    Layer.provideMerge(ServicesLive),
    Layer.provideMerge(UlidIdService),
    Layer.provide(HttpPlatform.layer),
    Layer.provide(Etag.layerWeak),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(NodePath.layer),
  );
};

export const makeWebHandler = (databaseFilename = lifeOsDbPath, AgentLive = DeepSeekAgentLive) => {
  const { handler, dispose } = HttpRouter.toWebHandler(makeAppLive(databaseFilename, AgentLive));

  return {
    handler: (request: Request) => handler(request, Context.empty() as Context.Context<unknown>),
    dispose,
  };
};

export const AppLive = makeAppLive();

export const { handler, dispose } = HttpRouter.toWebHandler(AppLive);

export const handleRequest = (request: Request) =>
  handler(request, Context.empty() as Context.Context<unknown>);
