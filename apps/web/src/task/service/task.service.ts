import type { Type as Task, TaskId, TaskModel } from "@template/core/domain/task.model";
import { Context, type Effect } from "effect";
import type { SchemaError } from "effect/Schema";
import type { HttpClientError } from "effect/unstable/http";
import type { HttpApiError } from "effect/unstable/httpapi";

export type TaskCreateInput = typeof TaskModel.jsonCreate.Type;

export type TaskUpdateInput = {
  readonly name: string;
};

export type TaskServiceError =
  | SchemaError
  | HttpClientError.HttpClientError
  | HttpApiError.NotFound;

export interface ITaskService {
  list: () => Effect.Effect<ReadonlyArray<Task>, TaskServiceError>;
  get(id: typeof TaskId.Type): Effect.Effect<Task, TaskServiceError>;
  create(input: TaskCreateInput): Effect.Effect<Task, TaskServiceError>;
  update(id: typeof TaskId.Type, input: TaskUpdateInput): Effect.Effect<Task, TaskServiceError>;
  remove(id: typeof TaskId.Type): Effect.Effect<void, TaskServiceError>;
}

export class TaskService extends Context.Service<TaskService, ITaskService>()("TaskService") {}
