import { Effect, Layer } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient, SqlModel } from "effect/unstable/sql";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";

import * as TaskModel from "@/domain/task.model";

import { TaskService, type ITaskService } from "./service/task.service";

export const SqlTaskService = Layer.effect(
  TaskService,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const repository = yield* SqlModel.makeRepository(TaskModel.TaskModel, {
      idColumn: "id",
      tableName: "task",
      spanPrefix: "SqlTaskService",
    });

    const listAll = SqlSchema.findAll({
      Request: Schema.Struct({}),
      Result: TaskModel.TaskModel,
      execute: () => sql`select * from task`,
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const create: ITaskService["create"] = Effect.fn("SqlTaskService.create")(function* (input) {
      const task = yield* TaskModel.make(input);

      yield* repository
        .insert(task)
        .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));

      return task;
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const list: ITaskService["list"] = Effect.fn("SqlTaskService.list")(function* () {
      return yield* listAll({}).pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const get: ITaskService["get"] = Effect.fn("SqlTaskService.get")(function* (id) {
      return yield* repository
        .findById(id)
        .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    /**
     * @since 0.0.0
     * @category service-method
     */
    const update: ITaskService["update"] = Effect.fn("SqlTaskService.update")(
      function* (id, input) {
        return yield* repository
          .update({ id, name: input.name })
          .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
      },
    );

    /**
     * @since 0.0.0
     * @category service-method
     */
    const remove: ITaskService["remove"] = Effect.fn("SqlTaskService.remove")(function* (id) {
      yield* repository.delete(id).pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)));
    });

    return {
      create,
      list,
      get,
      update,
      remove,
    };
  }),
);
