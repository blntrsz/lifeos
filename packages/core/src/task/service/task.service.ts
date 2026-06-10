import { Cause, Context, type Effect } from "effect";
import type { SchemaError } from "effect/Schema";

import type { IdService } from "@/domain/id/service/id.service";
import type { TaskId, TaskModel } from "@/domain/task.model";

export type TaskUpdateInput = {
  readonly name: string;
};

export interface ITaskService {
  create(input: typeof TaskModel.jsonCreate.Type): Effect.Effect<TaskModel, SchemaError, IdService>;
  list(): Effect.Effect<ReadonlyArray<TaskModel>, SchemaError>;
  get(id: typeof TaskId.Type): Effect.Effect<TaskModel, Cause.NoSuchElementError | SchemaError>;
  update(
    id: typeof TaskId.Type,
    input: TaskUpdateInput,
  ): Effect.Effect<TaskModel, Cause.NoSuchElementError | SchemaError>;
  remove(id: typeof TaskId.Type): Effect.Effect<void, SchemaError>;
}

export class TaskService extends Context.Service<TaskService, ITaskService>()("TaskService") {}
