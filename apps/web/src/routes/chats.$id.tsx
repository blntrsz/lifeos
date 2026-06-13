import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chats/$id")({ component: ChatPage });

function ChatPage() {
  const { id } = Route.useParams();

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-2xl font-semibold text-foreground">Chat</h1>
      <p className="mt-2 text-muted-foreground">{id}</p>
    </main>
  );
}
