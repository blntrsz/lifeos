import { NodeFileSystem, NodePath } from "@effect/platform-node-shared";
import { SqlChatService } from "@template/core/chat/sql-chat.service";
import { LifeOsDatabaseLive } from "@template/core/common/database";
import { UlidIdService } from "@template/core/domain/id/ulid-id.service";
import { SqlTaskService } from "@template/core/task/sql-task.service";
import { Context, Layer } from "effect";
import { Etag, HttpPlatform, HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { ChatRoutes } from "./chat/chat-routes.ts";
import { TaskApi } from "./task/task-api.ts";
import { TaskHandlers } from "./task/task-handlers.ts";

const lifeOsDbPath =
  process.env.LIFEOS_DATABASE_FILENAME ?? `${import.meta.dirname}/../data/lifeos.db`;

const makeAppLive = (databaseFilename = lifeOsDbPath) => {
  const DatabaseLive = LifeOsDatabaseLive(databaseFilename);
  const ServicesLive = Layer.mergeAll(SqlTaskService, SqlChatService).pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(UlidIdService),
  );

  return HttpApiBuilder.layer(TaskApi).pipe(
    Layer.provide(ChatRoutes),
    Layer.provide(TaskHandlers),
    Layer.provide(HttpApiScalar.layer(TaskApi)),
    Layer.provideMerge(ServicesLive),
    Layer.provideMerge(UlidIdService),
    Layer.provide(HttpPlatform.layer),
    Layer.provide(Etag.layerWeak),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(NodePath.layer),
  );
};

export const AppLive = makeAppLive();

export const { handler, dispose } = HttpRouter.toWebHandler(AppLive);

export const handleRequest = (request: Request) => handler(request, Context.empty());
