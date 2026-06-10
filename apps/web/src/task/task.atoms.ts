import { TaskId, type Type as Task } from "@template/core/domain/task.model";
import { Effect } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Atom from "effect/unstable/reactivity/Atom";

import { HttpTaskService } from "@/task/layer/http-task.service";
import { TaskService } from "@/task/service/task.service";
import { NoTaskSelectedError, TaskNameRequiredError } from "@/task/task.errors";

type MutationResult = AsyncResult.AsyncResult<unknown, unknown>;

const isBusy = (result: MutationResult) => !AsyncResult.isInitial(result) && result.waiting;
const errorMessage = (result: MutationResult) =>
  AsyncResult.isFailure(result) ? String(result.cause) : null;
const resetEdit = (get: Atom.Context) => {
  get.set(editingId, null);
  get.set(editName, "");
};

export const taskRuntime = Atom.runtime(HttpTaskService);

export const tasks = taskRuntime
  .atom(TaskService.use((service) => service.list()))
  .pipe(Atom.keepAlive);

export const draftName = Atom.make("");
export const editingId = Atom.make(null as string | null);
export const editName = Atom.make("");

export const createTask = taskRuntime.fn<void>()((_, get) =>
  Effect.gen(function* () {
    const name = get(draftName).trim();
    if (name.length === 0) {
      return yield* Effect.fail(new TaskNameRequiredError());
    }

    const service = yield* TaskService;
    yield* service.create({ name });
    get.set(draftName, "");
    get.refresh(tasks);
  }),
);

export const updateTask = taskRuntime.fn<void>()((_, get) =>
  Effect.gen(function* () {
    const id = get(editingId);
    if (id === null) {
      return yield* Effect.fail(new NoTaskSelectedError());
    }

    const name = get(editName).trim();
    if (name.length === 0) {
      return yield* Effect.fail(new TaskNameRequiredError());
    }

    const service = yield* TaskService;
    yield* service.update(TaskId.make(id), { name });
    resetEdit(get);
    get.refresh(tasks);
  }),
);

export const deleteTask = taskRuntime.fn((id: string, get) =>
  Effect.gen(function* () {
    const service = yield* TaskService;
    yield* service.remove(TaskId.make(id));
    if (get(editingId) === id) {
      resetEdit(get);
    }
    get.refresh(tasks);
  }),
);

export const taskBoard = Atom.make((get) => {
  const tasksResult = get(tasks);
  const name = get(draftName);
  const createState = get(createTask);

  return {
    tasksResult,
    count: AsyncResult.isSuccess(tasksResult) ? tasksResult.value.length : 0,
    draftName: name,
    canCreate: name.trim().length > 0,
    createBusy: isBusy(createState),
    createError: errorMessage(createState),
  };
});

export const startEdit = Atom.fn((id: string, get) =>
  Effect.sync(() => {
    const result = get(tasks);
    if (!AsyncResult.isSuccess(result)) {
      return;
    }

    const task = result.value.find((task) => task.id === id);
    if (task === undefined) {
      return;
    }

    get.set(editingId, id);
    get.set(editName, task.name);
  }),
);

export const cancelEdit = Atom.fn<void>()((_, get) => Effect.sync(() => resetEdit(get)));

export const taskRow = Atom.family((task: Task) =>
  Atom.make((get) => {
    const currentEditingId = get(editingId);
    const editing = currentEditingId === task.id;
    const busy = isBusy(get(updateTask)) || isBusy(get(deleteTask));
    const anotherRowEditing = currentEditingId !== null && !editing;

    return {
      isEditing: editing,
      editName: get(editName),
      busy,
      editDisabled: busy || anotherRowEditing,
      deleteDisabled: busy || currentEditingId !== null,
    };
  }),
);
