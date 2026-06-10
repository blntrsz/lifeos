import { useAtom, useAtomMount, useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as TasksAtom from "@/task/task.atoms";

import { TaskRow } from "./task-row";

export function TaskBoard() {
  useAtomMount(TasksAtom.tasks);

  const board = useAtomValue(TasksAtom.taskBoard);
  const [, setName] = useAtom(TasksAtom.draftName);
  const create = useAtomSet(TasksAtom.createTask, { mode: "promise" });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-3xl">Tasks</CardTitle>
        <CardDescription>
          Effect Atom CRUD — {board.count} task{board.count === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <Input
            placeholder="New task name"
            value={board.draftName}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" disabled={board.createBusy || !board.canCreate}>
            Add
          </Button>
        </form>

        {board.createError !== null ? (
          <p className="text-sm text-destructive" role="alert">
            {board.createError}
          </p>
        ) : null}

        {AsyncResult.match(board.tasksResult, {
          onInitial: () => (
            <p className="text-muted-foreground" aria-busy="true">
              Loading tasks…
            </p>
          ),
          onFailure: (failure) => (
            <p className="text-sm text-destructive" role="alert">
              {String(failure.cause)}
            </p>
          ),
          onSuccess: ({ value: tasks }) => (
            <ul className="divide-y divide-border rounded-md border">
              {tasks.length === 0 ? (
                <li className="px-4 py-3 text-muted-foreground">No tasks yet.</li>
              ) : (
                tasks.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </ul>
          ),
        })}
      </CardContent>
    </Card>
  );
}
