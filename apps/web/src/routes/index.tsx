import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "@/task/task-board";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="p-8">
      <TaskBoard />
    </main>
  );
}
