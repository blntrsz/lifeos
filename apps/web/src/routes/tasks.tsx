import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "@/task/task-board";

export const Route = createFileRoute("/tasks")({ component: Tasks });

function Tasks() {
  return (
    <main className="p-8">
      <TaskBoard />
    </main>
  );
}
