import { NodeFileSystem, NodePath } from "@effect/platform-node-shared";
import { layer as DatabaseLive } from "@template/core/common/database";
import { UlidIdService } from "@template/core/domain/id/ulid-id.service";
import { SqlTaskService } from "@template/core/task/sql-task.service";
import { Context, Layer } from "effect";
import { Etag, HttpPlatform, HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { TaskApi } from "./task/task-api.ts";
import { TaskHandlers } from "./task/task-handlers.ts";

const dbPath = `${import.meta.dirname}/../data/tasks.db`;

const TaskLive = SqlTaskService.pipe(
  Layer.provide(DatabaseLive(dbPath)),
  Layer.provide(UlidIdService),
);

export const AppLive = HttpApiBuilder.layer(TaskApi).pipe(
  Layer.provide(TaskHandlers),
  Layer.provide(HttpApiScalar.layer(TaskApi)),
  Layer.provideMerge(TaskLive),
  Layer.provideMerge(UlidIdService),
  Layer.provide(HttpPlatform.layer),
  Layer.provide(Etag.layerWeak),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layer),
);

export const { handler, dispose } = HttpRouter.toWebHandler(AppLive);

export const handleRequest = (request: Request) => handler(request, Context.empty());
