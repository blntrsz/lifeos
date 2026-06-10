import { TaskService } from "@template/core/task/service/task.service";
import { Effect } from "effect";
import * as Cause from "effect/Cause";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { TaskApi } from "./task-api.ts";

const taskNotFound = <A, E, R>(self: Effect.Effect<A, E | Cause.NoSuchElementError, R>) =>
  self.pipe(
    Effect.catchTag("NoSuchElementError", () => Effect.fail(new HttpApiError.NotFound({}))),
  );

export const TaskHandlers = HttpApiBuilder.group(TaskApi, "Tasks", (handlers) =>
  handlers
    .handle("list", () =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        return yield* tasks.list().pipe(Effect.orDie);
      }),
    )
    .handle("get", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        return yield* tasks.get(params.id).pipe(taskNotFound, Effect.orDie);
      }),
    )
    .handle("create", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        return yield* tasks.create(payload).pipe(Effect.orDie);
      }),
    )
    .handle("update", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        return yield* tasks.update(params.id, payload).pipe(taskNotFound, Effect.orDie);
      }),
    )
    .handle("remove", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        return yield* tasks.remove(params.id).pipe(Effect.orDie);
      }),
    ),
);
