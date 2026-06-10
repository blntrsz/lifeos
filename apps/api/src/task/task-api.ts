import { TaskId, TaskModel } from "@template/core/domain/task.model";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

const TaskIdParams = { id: TaskId };

const TaskUpdatePayload = Schema.Struct({ name: Schema.String });

const notFound = [HttpApiError.NotFound] as const;

export const TaskApi = HttpApi.make("TaskApi")
  .annotate(OpenApi.Title, "Task API")
  .add(
    HttpApiGroup.make("Tasks").add(
      HttpApiEndpoint.get("list", "/tasks", {
        success: Schema.Array(TaskModel.json),
      }),
      HttpApiEndpoint.get("get", "/tasks/:id", {
        params: TaskIdParams,
        success: TaskModel.json,
        error: notFound,
      }),
      HttpApiEndpoint.post("create", "/tasks", {
        payload: TaskModel.jsonCreate,
        success: TaskModel.json,
      }),
      HttpApiEndpoint.patch("update", "/tasks/:id", {
        params: TaskIdParams,
        payload: TaskUpdatePayload,
        success: TaskModel.json,
        error: notFound,
      }),
      HttpApiEndpoint.delete("remove", "/tasks/:id", {
        params: TaskIdParams,
        error: notFound,
      }),
    ),
  )
  .prefix("/api");
