import { TaskApi } from "@template/api/task-api";
import { TaskModel } from "@template/core/domain/task.model";
import { Effect, Layer, Array } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { HttpApiClient } from "effect/unstable/httpapi";

import { TaskService, type ITaskService } from "@/task/service/task.service";

export const HttpTaskService = Layer.effect(
  TaskService,
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(TaskApi, {
      baseUrl: globalThis.location?.origin ?? "http://localhost:3000",
    });
    const tasks = client.Tasks;

    /**
     * @since 0.0.0
     * @category service-method
     */
    const list: ITaskService["list"] = Effect.fn("TaskService.list")(function* () {
      return yield* tasks.list({}).pipe(Effect.map(Array.map((task) => TaskModel.make(task))));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const get: ITaskService["get"] = Effect.fn("TaskService.get")(function* (id) {
      return yield* tasks.get({ params: { id } }).pipe(Effect.map((task) => TaskModel.make(task)));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const create: ITaskService["create"] = Effect.fn("TaskService.create")(function* (input) {
      return yield* tasks
        .create({ payload: input })
        .pipe(Effect.map((task) => TaskModel.make(task)));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const update: ITaskService["update"] = Effect.fn("TaskService.update")(function* (id, input) {
      return yield* tasks
        .update({ params: { id }, payload: input })
        .pipe(Effect.map((task) => TaskModel.make(task)));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const remove: ITaskService["remove"] = Effect.fn("TaskService.remove")(function* (id) {
      return yield* tasks.remove({ params: { id } }).pipe(Effect.asVoid);
    });

    return {
      list,
      get,
      create,
      update,
      remove,
    };
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
