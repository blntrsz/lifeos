import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { Type as Task } from "@template/core/domain/task.model";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as TasksAtom from "@/task/task.atoms";

export function TaskRow({ task }: { readonly task: Task }) {
  const row = useAtomValue(TasksAtom.taskRow(task));
  const [, setEditName] = useAtom(TasksAtom.editName);
  const startEdit = useAtomSet(TasksAtom.startEdit);
  const cancelEdit = useAtomSet(TasksAtom.cancelEdit);
  const save = useAtomSet(TasksAtom.updateTask, { mode: "promise" });
  const remove = useAtomSet(TasksAtom.deleteTask, { mode: "promise" });

  if (row.isEditing) {
    return (
      <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <Input
          value={row.editName}
          onChange={(event) => setEditName(event.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={row.busy} onClick={() => void save()}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={row.busy}
            onClick={() => cancelEdit()}
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="font-medium">{task.name}</span>
        <span className="ml-2 font-mono text-xs text-muted-foreground">{task.id}</span>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={row.editDisabled}
          onClick={() => startEdit(task.id)}
        >
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={row.deleteDisabled}
          onClick={() => void remove(task.id)}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
