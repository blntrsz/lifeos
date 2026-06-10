import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { IdService } from "@/domain/id/service/id.service";

/**
 * @since 0.0.0
 * @category id
 */
export const TaskId = Schema.String.pipe(Schema.brand("TaskId"));

/**
 * @since 0.0.0
 * @category model
 */
export class TaskModel extends Model.Class<TaskModel>("Task")({
  id: Model.GeneratedByApp(TaskId),
  name: Schema.String,
}) {}

/**
 * @since 0.0.0
 * @category model-type
 */
export type Type = typeof TaskModel.Type;

/**
 * @since 0.0.0
 * @category model-method
 */
export const createTaskId = Effect.fn("TaskModel.createTaskId")(function* () {
  const idService = yield* IdService;
  const id = yield* idService.create();

  return TaskId.make(`tsk-${id}`);
});

/**
 * @since 0.0.0
 * @category model-method
 */
export const make = Effect.fn("TaskModel.make")(function* (
  input: typeof TaskModel.jsonCreate.Type,
) {
  const id = yield* createTaskId();

  return TaskModel.make({
    id,
    ...input,
  });
});
